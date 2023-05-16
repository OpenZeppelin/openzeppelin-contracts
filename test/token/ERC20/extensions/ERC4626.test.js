const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { Enum } = require('../../../helpers/enums');

const ERC20Decimals = artifacts.require('$ERC20DecimalsMock');
const ERC4626 = artifacts.require('$ERC4626');
const ERC4626OffsetMock = artifacts.require('$ERC4626OffsetMock');
const ERC4626FeesMock = artifacts.require('$ERC4626FeesMock');
const ERC20ExcessDecimalsMock = artifacts.require('ERC20ExcessDecimalsMock');
const ERC20Reentrant = artifacts.require('$ERC20Reentrant');

contract('ERC4626', function (accounts) {
  const [holder, recipient, spender, other, user1, user2] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const decimals = web3.utils.toBN(18);

  it('inherit decimals if from asset', async function () {
    for (const decimals of [0, 9, 12, 18, 36].map(web3.utils.toBN)) {
      const token = await ERC20Decimals.new('', '', decimals);
      const vault = await ERC4626.new('', '', token.address);
      expect(await vault.decimals()).to.be.bignumber.equal(decimals);
    }
  });

  it('asset has not yet been created', async function () {
    const vault = await ERC4626.new('', '', other);
    expect(await vault.decimals()).to.be.bignumber.equal(decimals);
  });

  it('underlying excess decimals', async function () {
    const token = await ERC20ExcessDecimalsMock.new();
    const vault = await ERC4626.new('', '', token.address);
    expect(await vault.decimals()).to.be.bignumber.equal(decimals);
  });

  it('decimals overflow', async function () {
    for (const offset of [243, 250, 255].map(web3.utils.toBN)) {
      const token = await ERC20Decimals.new('', '', decimals);
      const vault = await ERC4626OffsetMock.new(name + ' Vault', symbol + 'V', token.address, offset);
      await expectRevert(
        vault.decimals(),
        'reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)',
      );
    }
  });

  describe('reentrancy', async function () {
    const reenterType = Enum('No', 'Before', 'After');

    const amount = web3.utils.toBN(1000000000000000000);
    const reenterAmount = web3.utils.toBN(1000000000);
    let token;
    let vault;

    beforeEach(async function () {
      token = await ERC20Reentrant.new();
      // Use offset 1 so the rate is not 1:1 and we can't possibly confuse assets and shares
      vault = await ERC4626OffsetMock.new('', '', token.address, 1);
      // Funds and approval for tests
      await token.$_mint(holder, amount);
      await token.$_mint(other, amount);
      await token.$_approve(holder, vault.address, constants.MAX_UINT256);
      await token.$_approve(other, vault.address, constants.MAX_UINT256);
      await token.$_approve(token.address, vault.address, constants.MAX_UINT256);
    });

    // During a `_deposit`, the vault does `transferFrom(depositor, vault, assets)` -> `_mint(receiver, shares)`
    // such that a reentrancy BEFORE the transfer guarantees the price is kept the same.
    // If the order of transfer -> mint is changed to mint -> transfer, the reentrancy could be triggered on an
    // intermediate state in which the ratio of assets/shares has been decreased (more shares than assets).
    it('correct share price is observed during reentrancy before deposit', async function () {
      // mint token for deposit
      await token.$_mint(token.address, reenterAmount);

      // Schedules a reentrancy from the token contract
      await token.scheduleReenter(
        reenterType.Before,
        vault.address,
        vault.contract.methods.deposit(reenterAmount, holder).encodeABI(),
      );

      // Initial share price
      const sharesForDeposit = await vault.previewDeposit(amount, { from: holder });
      const sharesForReenter = await vault.previewDeposit(reenterAmount, { from: holder });

      // Do deposit normally, triggering the _beforeTokenTransfer hook
      const receipt = await vault.deposit(amount, holder, { from: holder });

      // Main deposit event
      await expectEvent(receipt, 'Deposit', {
        sender: holder,
        owner: holder,
        assets: amount,
        shares: sharesForDeposit,
      });
      // Reentrant deposit event → uses the same price
      await expectEvent(receipt, 'Deposit', {
        sender: token.address,
        owner: holder,
        assets: reenterAmount,
        shares: sharesForReenter,
      });

      // Assert prices is kept
      const sharesAfter = await vault.previewDeposit(amount, { from: holder });
      expect(sharesForDeposit).to.be.bignumber.eq(sharesAfter);
    });

    // During a `_withdraw`, the vault does `_burn(owner, shares)` -> `transfer(receiver, assets)`
    // such that a reentrancy AFTER the transfer guarantees the price is kept the same.
    // If the order of burn -> transfer is changed to transfer -> burn, the reentrancy could be triggered on an
    // intermediate state in which the ratio of shares/assets has been decreased (more assets than shares).
    it('correct share price is observed during reentrancy after withdraw', async function () {
      // Deposit into the vault: holder gets `amount` share, token.address gets `reenterAmount` shares
      await vault.deposit(amount, holder, { from: holder });
      await vault.deposit(reenterAmount, token.address, { from: other });

      // Schedules a reentrancy from the token contract
      await token.scheduleReenter(
        reenterType.After,
        vault.address,
        vault.contract.methods.withdraw(reenterAmount, holder, token.address).encodeABI(),
      );

      // Initial share price
      const sharesForWithdraw = await vault.previewWithdraw(amount, { from: holder });
      const sharesForReenter = await vault.previewWithdraw(reenterAmount, { from: holder });

      // Do withdraw normally, triggering the _afterTokenTransfer hook
      const receipt = await vault.withdraw(amount, holder, holder, { from: holder });

      // Main withdraw event
      await expectEvent(receipt, 'Withdraw', {
        sender: holder,
        receiver: holder,
        owner: holder,
        assets: amount,
        shares: sharesForWithdraw,
      });
      // Reentrant withdraw event → uses the same price
      await expectEvent(receipt, 'Withdraw', {
        sender: token.address,
        receiver: holder,
        owner: token.address,
        assets: reenterAmount,
        shares: sharesForReenter,
      });

      // Assert price is kept
      const sharesAfter = await vault.previewWithdraw(amount, { from: holder });
      expect(sharesForWithdraw).to.be.bignumber.eq(sharesAfter);
    });

    // Donate newly minted tokens to the vault during the reentracy causes the share price to increase.
    // Still, the deposit that trigger the reentracy is not affected and get the previewed price.
    // Further deposits will get a different price (getting fewer shares for the same amount of assets)
    it('share price change during reentracy does not affect deposit', async function () {
      // Schedules a reentrancy from the token contract that mess up the share price
      await token.scheduleReenter(
        reenterType.Before,
        token.address,
        token.contract.methods.$_mint(vault.address, reenterAmount).encodeABI(),
      );

      // Price before
      const sharesBefore = await vault.previewDeposit(amount);

      // Deposit, triggering the _beforeTokenTransfer hook
      const receipt = await vault.deposit(amount, holder, { from: holder });

      // Price is as previewed
      await expectEvent(receipt, 'Deposit', {
        sender: holder,
        owner: holder,
        assets: amount,
        shares: sharesBefore,
      });

      // Price was modified during reentrancy
      const sharesAfter = await vault.previewDeposit(amount);
      expect(sharesAfter).to.be.bignumber.lt(sharesBefore);
    });

    // Burn some tokens from the vault during the reentracy causes the share price to drop.
    // Still, the withdraw that trigger the reentracy is not affected and get the previewed price.
    // Further withdraw will get a different price (needing more shares for the same amount of assets)
    it('share price change during reentracy does not affect withdraw', async function () {
      await vault.deposit(amount, other, { from: other });
      await vault.deposit(amount, holder, { from: holder });

      // Schedules a reentrancy from the token contract that mess up the share price
      await token.scheduleReenter(
        reenterType.After,
        token.address,
        token.contract.methods.$_burn(vault.address, reenterAmount).encodeABI(),
      );

      // Price before
      const sharesBefore = await vault.previewWithdraw(amount);

      // Withdraw, triggering the _afterTokenTransfer hook
      const receipt = await vault.withdraw(amount, holder, holder, { from: holder });

      // Price is as previewed
      await expectEvent(receipt, 'Withdraw', {
        sender: holder,
        receiver: holder,
        owner: holder,
        assets: amount,
        shares: sharesBefore,
      });

      // Price was modified during reentrancy
      const sharesAfter = await vault.previewWithdraw(amount);
      expect(sharesAfter).to.be.bignumber.gt(sharesBefore);
    });
  });

  for (const offset of [0, 6, 18].map(web3.utils.toBN)) {
    const parseToken = token => web3.utils.toBN(10).pow(decimals).muln(token);
    const parseShare = share => web3.utils.toBN(10).pow(decimals.add(offset)).muln(share);

    const virtualAssets = web3.utils.toBN(1);
    const virtualShares = web3.utils.toBN(10).pow(offset);

    describe(`offset: ${offset}`, function () {
      beforeEach(async function () {
        this.token = await ERC20Decimals.new(name, symbol, decimals);
        this.vault = await ERC4626OffsetMock.new(name + ' Vault', symbol + 'V', this.token.address, offset);

        await this.token.$_mint(holder, constants.MAX_INT256); // 50% of maximum
        await this.token.approve(this.vault.address, constants.MAX_UINT256, { from: holder });
        await this.vault.approve(spender, constants.MAX_UINT256, { from: holder });
      });

      it('metadata', async function () {
        expect(await this.vault.name()).to.be.equal(name + ' Vault');
        expect(await this.vault.symbol()).to.be.equal(symbol + 'V');
        expect(await this.vault.decimals()).to.be.bignumber.equal(decimals.add(offset));
        expect(await this.vault.asset()).to.be.equal(this.token.address);
      });

      describe('empty vault: no assets & no shares', function () {
        it('status', async function () {
          expect(await this.vault.totalAssets()).to.be.bignumber.equal('0');
        });

        it('deposit', async function () {
          expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
          expect(await this.vault.previewDeposit(parseToken(1))).to.be.bignumber.equal(parseShare(1));

          const { tx } = await this.vault.deposit(parseToken(1), recipient, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: holder,
            to: this.vault.address,
            value: parseToken(1),
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: constants.ZERO_ADDRESS,
            to: recipient,
            value: parseShare(1),
          });

          await expectEvent.inTransaction(tx, this.vault, 'Deposit', {
            sender: holder,
            owner: recipient,
            assets: parseToken(1),
            shares: parseShare(1),
          });
        });

        it('mint', async function () {
          expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
          expect(await this.vault.previewMint(parseShare(1))).to.be.bignumber.equal(parseToken(1));

          const { tx } = await this.vault.mint(parseShare(1), recipient, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: holder,
            to: this.vault.address,
            value: parseToken(1),
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: constants.ZERO_ADDRESS,
            to: recipient,
            value: parseShare(1),
          });

          await expectEvent.inTransaction(tx, this.vault, 'Deposit', {
            sender: holder,
            owner: recipient,
            assets: parseToken(1),
            shares: parseShare(1),
          });
        });

        it('withdraw', async function () {
          expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
          expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');

          const { tx } = await this.vault.withdraw('0', recipient, holder, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: this.vault.address,
            to: recipient,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: holder,
            to: constants.ZERO_ADDRESS,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Withdraw', {
            sender: holder,
            receiver: recipient,
            owner: holder,
            assets: '0',
            shares: '0',
          });
        });

        it('redeem', async function () {
          expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal('0');
          expect(await this.vault.previewRedeem('0')).to.be.bignumber.equal('0');

          const { tx } = await this.vault.redeem('0', recipient, holder, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: this.vault.address,
            to: recipient,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: holder,
            to: constants.ZERO_ADDRESS,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Withdraw', {
            sender: holder,
            receiver: recipient,
            owner: holder,
            assets: '0',
            shares: '0',
          });
        });
      });

      describe('inflation attack: offset price by direct deposit of assets', function () {
        beforeEach(async function () {
          // Donate 1 token to the vault to offset the price
          await this.token.$_mint(this.vault.address, parseToken(1));
        });

        it('status', async function () {
          expect(await this.vault.totalSupply()).to.be.bignumber.equal('0');
          expect(await this.vault.totalAssets()).to.be.bignumber.equal(parseToken(1));
        });

        /**
         * | offset | deposited assets     | redeemable assets    |
         * |--------|----------------------|----------------------|
         * | 0      | 1.000000000000000000 | 0.                   |
         * | 6      | 1.000000000000000000 | 0.999999000000000000 |
         * | 18     | 1.000000000000000000 | 0.999999999999999999 |
         *
         * Attack is possible, but made difficult by the offset. For the attack to be successful
         * the attacker needs to frontrun a deposit 10**offset times bigger than what the victim
         * was trying to deposit
         */
        it('deposit', async function () {
          const effectiveAssets = await this.vault.totalAssets().then(x => x.add(virtualAssets));
          const effectiveShares = await this.vault.totalSupply().then(x => x.add(virtualShares));

          const depositAssets = parseToken(1);
          const expectedShares = depositAssets.mul(effectiveShares).div(effectiveAssets);

          expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
          expect(await this.vault.previewDeposit(depositAssets)).to.be.bignumber.equal(expectedShares);

          const { tx } = await this.vault.deposit(depositAssets, recipient, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: holder,
            to: this.vault.address,
            value: depositAssets,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: constants.ZERO_ADDRESS,
            to: recipient,
            value: expectedShares,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Deposit', {
            sender: holder,
            owner: recipient,
            assets: depositAssets,
            shares: expectedShares,
          });
        });

        /**
         * | offset | deposited assets     | redeemable assets    |
         * |--------|----------------------|----------------------|
         * | 0      | 1000000000000000001. | 1000000000000000001. |
         * | 6      | 1000000000000000001. | 1000000000000000001. |
         * | 18     | 1000000000000000001. | 1000000000000000001. |
         *
         * Using mint protects against inflation attack, but makes minting shares very expensive.
         * The ER20 allowance for the underlying asset is needed to protect the user from (too)
         * large deposits.
         */
        it('mint', async function () {
          const effectiveAssets = await this.vault.totalAssets().then(x => x.add(virtualAssets));
          const effectiveShares = await this.vault.totalSupply().then(x => x.add(virtualShares));

          const mintShares = parseShare(1);
          const expectedAssets = mintShares.mul(effectiveAssets).div(effectiveShares);

          expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
          expect(await this.vault.previewMint(mintShares)).to.be.bignumber.equal(expectedAssets);

          const { tx } = await this.vault.mint(mintShares, recipient, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: holder,
            to: this.vault.address,
            value: expectedAssets,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: constants.ZERO_ADDRESS,
            to: recipient,
            value: mintShares,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Deposit', {
            sender: holder,
            owner: recipient,
            assets: expectedAssets,
            shares: mintShares,
          });
        });

        it('withdraw', async function () {
          expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
          expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');

          const { tx } = await this.vault.withdraw('0', recipient, holder, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: this.vault.address,
            to: recipient,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: holder,
            to: constants.ZERO_ADDRESS,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Withdraw', {
            sender: holder,
            receiver: recipient,
            owner: holder,
            assets: '0',
            shares: '0',
          });
        });

        it('redeem', async function () {
          expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal('0');
          expect(await this.vault.previewRedeem('0')).to.be.bignumber.equal('0');

          const { tx } = await this.vault.redeem('0', recipient, holder, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: this.vault.address,
            to: recipient,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: holder,
            to: constants.ZERO_ADDRESS,
            value: '0',
          });

          await expectEvent.inTransaction(tx, this.vault, 'Withdraw', {
            sender: holder,
            receiver: recipient,
            owner: holder,
            assets: '0',
            shares: '0',
          });
        });
      });

      describe('full vault: assets & shares', function () {
        beforeEach(async function () {
          // Add 1 token of underlying asset and 100 shares to the vault
          await this.token.$_mint(this.vault.address, parseToken(1));
          await this.vault.$_mint(holder, parseShare(100));
        });

        it('status', async function () {
          expect(await this.vault.totalSupply()).to.be.bignumber.equal(parseShare(100));
          expect(await this.vault.totalAssets()).to.be.bignumber.equal(parseToken(1));
        });

        /**
         * | offset | deposited assets     | redeemable assets    |
         * |--------|--------------------- |----------------------|
         * | 0      | 1.000000000000000000 | 0.999999999999999999 |
         * | 6      | 1.000000000000000000 | 0.999999999999999999 |
         * | 18     | 1.000000000000000000 | 0.999999999999999999 |
         *
         * Virtual shares & assets captures part of the value
         */
        it('deposit', async function () {
          const effectiveAssets = await this.vault.totalAssets().then(x => x.add(virtualAssets));
          const effectiveShares = await this.vault.totalSupply().then(x => x.add(virtualShares));

          const depositAssets = parseToken(1);
          const expectedShares = depositAssets.mul(effectiveShares).div(effectiveAssets);

          expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
          expect(await this.vault.previewDeposit(depositAssets)).to.be.bignumber.equal(expectedShares);

          const { tx } = await this.vault.deposit(depositAssets, recipient, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: holder,
            to: this.vault.address,
            value: depositAssets,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: constants.ZERO_ADDRESS,
            to: recipient,
            value: expectedShares,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Deposit', {
            sender: holder,
            owner: recipient,
            assets: depositAssets,
            shares: expectedShares,
          });
        });

        /**
         * | offset | deposited assets     | redeemable assets    |
         * |--------|--------------------- |----------------------|
         * | 0      | 0.010000000000000001 | 0.010000000000000000 |
         * | 6      | 0.010000000000000001 | 0.010000000000000000 |
         * | 18     | 0.010000000000000001 | 0.010000000000000000 |
         *
         * Virtual shares & assets captures part of the value
         */
        it('mint', async function () {
          const effectiveAssets = await this.vault.totalAssets().then(x => x.add(virtualAssets));
          const effectiveShares = await this.vault.totalSupply().then(x => x.add(virtualShares));

          const mintShares = parseShare(1);
          const expectedAssets = mintShares.mul(effectiveAssets).div(effectiveShares).addn(1); // add for the rounding

          expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
          expect(await this.vault.previewMint(mintShares)).to.be.bignumber.equal(expectedAssets);

          const { tx } = await this.vault.mint(mintShares, recipient, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: holder,
            to: this.vault.address,
            value: expectedAssets,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: constants.ZERO_ADDRESS,
            to: recipient,
            value: mintShares,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Deposit', {
            sender: holder,
            owner: recipient,
            assets: expectedAssets,
            shares: mintShares,
          });
        });

        it('withdraw', async function () {
          const effectiveAssets = await this.vault.totalAssets().then(x => x.add(virtualAssets));
          const effectiveShares = await this.vault.totalSupply().then(x => x.add(virtualShares));

          const withdrawAssets = parseToken(1);
          const expectedShares = withdrawAssets.mul(effectiveShares).div(effectiveAssets).addn(1); // add for the rounding

          expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal(withdrawAssets);
          expect(await this.vault.previewWithdraw(withdrawAssets)).to.be.bignumber.equal(expectedShares);

          const { tx } = await this.vault.withdraw(withdrawAssets, recipient, holder, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: this.vault.address,
            to: recipient,
            value: withdrawAssets,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: holder,
            to: constants.ZERO_ADDRESS,
            value: expectedShares,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Withdraw', {
            sender: holder,
            receiver: recipient,
            owner: holder,
            assets: withdrawAssets,
            shares: expectedShares,
          });
        });

        it('withdraw with approval', async function () {
          await expectRevert(
            this.vault.withdraw(parseToken(1), recipient, holder, { from: other }),
            'ERC20: insufficient allowance',
          );

          await this.vault.withdraw(parseToken(1), recipient, holder, { from: spender });
        });

        it('redeem', async function () {
          const effectiveAssets = await this.vault.totalAssets().then(x => x.add(virtualAssets));
          const effectiveShares = await this.vault.totalSupply().then(x => x.add(virtualShares));

          const redeemShares = parseShare(100);
          const expectedAssets = redeemShares.mul(effectiveAssets).div(effectiveShares);

          expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal(redeemShares);
          expect(await this.vault.previewRedeem(redeemShares)).to.be.bignumber.equal(expectedAssets);

          const { tx } = await this.vault.redeem(redeemShares, recipient, holder, { from: holder });

          await expectEvent.inTransaction(tx, this.token, 'Transfer', {
            from: this.vault.address,
            to: recipient,
            value: expectedAssets,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
            from: holder,
            to: constants.ZERO_ADDRESS,
            value: redeemShares,
          });

          await expectEvent.inTransaction(tx, this.vault, 'Withdraw', {
            sender: holder,
            receiver: recipient,
            owner: holder,
            assets: expectedAssets,
            shares: redeemShares,
          });
        });

        it('redeem with approval', async function () {
          await expectRevert(
            this.vault.redeem(parseShare(100), recipient, holder, { from: other }),
            'ERC20: insufficient allowance',
          );

          await this.vault.redeem(parseShare(100), recipient, holder, { from: spender });
        });
      });
    });
  }

  describe('ERC4626Fees', function () {
    const feeBasePoint = web3.utils.toBN(5e3);
    const amountWithoutFees = web3.utils.toBN(10000);
    const fees = amountWithoutFees.mul(feeBasePoint).divn(1e5);
    const amountWithFees = amountWithoutFees.add(fees);

    describe('input fees', function () {
      beforeEach(async function () {
        this.token = await ERC20Decimals.new(name, symbol, 18);
        this.vault = await ERC4626FeesMock.new(
          name + ' Vault',
          symbol + 'V',
          this.token.address,
          feeBasePoint,
          other,
          0,
          constants.ZERO_ADDRESS,
        );

        await this.token.$_mint(holder, constants.MAX_INT256);
        await this.token.approve(this.vault.address, constants.MAX_INT256, { from: holder });
      });

      it('deposit', async function () {
        expect(await this.vault.previewDeposit(amountWithFees)).to.be.bignumber.equal(amountWithoutFees);
        ({ tx: this.tx } = await this.vault.deposit(amountWithFees, recipient, { from: holder }));
      });

      it('mint', async function () {
        expect(await this.vault.previewMint(amountWithoutFees)).to.be.bignumber.equal(amountWithFees);
        ({ tx: this.tx } = await this.vault.mint(amountWithoutFees, recipient, { from: holder }));
      });

      afterEach(async function () {
        // get total
        await expectEvent.inTransaction(this.tx, this.token, 'Transfer', {
          from: holder,
          to: this.vault.address,
          value: amountWithFees,
        });

        // redirect fees
        await expectEvent.inTransaction(this.tx, this.token, 'Transfer', {
          from: this.vault.address,
          to: other,
          value: fees,
        });

        // mint shares
        await expectEvent.inTransaction(this.tx, this.vault, 'Transfer', {
          from: constants.ZERO_ADDRESS,
          to: recipient,
          value: amountWithoutFees,
        });

        // deposit event
        await expectEvent.inTransaction(this.tx, this.vault, 'Deposit', {
          sender: holder,
          owner: recipient,
          assets: amountWithFees,
          shares: amountWithoutFees,
        });
      });
    });

    describe('output fees', function () {
      beforeEach(async function () {
        this.token = await ERC20Decimals.new(name, symbol, 18);
        this.vault = await ERC4626FeesMock.new(
          name + ' Vault',
          symbol + 'V',
          this.token.address,
          0,
          constants.ZERO_ADDRESS,
          5e3, // 5%
          other,
        );

        await this.token.$_mint(this.vault.address, constants.MAX_INT256);
        await this.vault.$_mint(holder, constants.MAX_INT256);
      });

      it('redeem', async function () {
        expect(await this.vault.previewRedeem(amountWithFees)).to.be.bignumber.equal(amountWithoutFees);
        ({ tx: this.tx } = await this.vault.redeem(amountWithFees, recipient, holder, { from: holder }));
      });

      it('withdraw', async function () {
        expect(await this.vault.previewWithdraw(amountWithoutFees)).to.be.bignumber.equal(amountWithFees);
        ({ tx: this.tx } = await this.vault.withdraw(amountWithoutFees, recipient, holder, { from: holder }));
      });

      afterEach(async function () {
        // withdraw principal
        await expectEvent.inTransaction(this.tx, this.token, 'Transfer', {
          from: this.vault.address,
          to: recipient,
          value: amountWithoutFees,
        });

        // redirect fees
        await expectEvent.inTransaction(this.tx, this.token, 'Transfer', {
          from: this.vault.address,
          to: other,
          value: fees,
        });

        // mint shares
        await expectEvent.inTransaction(this.tx, this.vault, 'Transfer', {
          from: holder,
          to: constants.ZERO_ADDRESS,
          value: amountWithFees,
        });

        // withdraw event
        await expectEvent.inTransaction(this.tx, this.vault, 'Withdraw', {
          sender: holder,
          receiver: recipient,
          owner: holder,
          assets: amountWithoutFees,
          shares: amountWithFees,
        });
      });
    });
  });

  /// Scenario inspired by solmate ERC4626 tests:
  /// https://github.com/transmissions11/solmate/blob/main/src/test/ERC4626.t.sol
  it('multiple mint, deposit, redeem & withdrawal', async function () {
    // test designed with both asset using similar decimals
    this.token = await ERC20Decimals.new(name, symbol, 18);
    this.vault = await ERC4626.new(name + ' Vault', symbol + 'V', this.token.address);

    await this.token.$_mint(user1, 4000);
    await this.token.$_mint(user2, 7001);
    await this.token.approve(this.vault.address, 4000, { from: user1 });
    await this.token.approve(this.vault.address, 7001, { from: user2 });

    // 1. Alice mints 2000 shares (costs 2000 tokens)
    {
      const { tx } = await this.vault.mint(2000, user1, { from: user1 });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user1,
        to: this.vault.address,
        value: '2000',
      });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: user1,
        value: '2000',
      });

      expect(await this.vault.previewDeposit(2000)).to.be.bignumber.equal('2000');
      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('2000');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('2000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('0');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('2000');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('2000');
    }

    // 2. Bob deposits 4000 tokens (mints 4000 shares)
    {
      const { tx } = await this.vault.mint(4000, user2, { from: user2 });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user2,
        to: this.vault.address,
        value: '4000',
      });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: user2,
        value: '4000',
      });

      expect(await this.vault.previewDeposit(4000)).to.be.bignumber.equal('4000');
      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('2000');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('2000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('4000');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('6000');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('6000');
    }

    // 3. Vault mutates by +3000 tokens (simulated yield returned from strategy)
    await this.token.$_mint(this.vault.address, 3000);

    expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('2000');
    expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4000');
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('2999'); // used to be 3000, but virtual assets/shares captures part of the yield
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('5999'); // used to be 6000, but virtual assets/shares captures part of the yield
    expect(await this.vault.totalSupply()).to.be.bignumber.equal('6000');
    expect(await this.vault.totalAssets()).to.be.bignumber.equal('9000');

    // 4. Alice deposits 2000 tokens (mints 1333 shares)
    {
      const { tx } = await this.vault.deposit(2000, user1, { from: user1 });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user1,
        to: this.vault.address,
        value: '2000',
      });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: user1,
        value: '1333',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('3333');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('4999');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('6000');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('7333');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('11000');
    }

    // 5. Bob mints 2000 shares (costs 3001 assets)
    // NOTE: Bob's assets spent got rounded up
    // NOTE: Alices's vault assets got rounded up
    {
      const { tx } = await this.vault.mint(2000, user2, { from: user2 });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user2,
        to: this.vault.address,
        value: '3000', // used to be 3001
      });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: user2,
        value: '2000',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('3333');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('6000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('4999'); // used to be 5000
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('9000');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('9333');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('14000'); // used to be 14001
    }

    // 6. Vault mutates by +3000 tokens
    // NOTE: Vault holds 17001 tokens, but sum of assetsOf() is 17000.
    await this.token.$_mint(this.vault.address, 3000);

    expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('3333');
    expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('6000');
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('6070'); // used to be 6071
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('10928'); // used to be 10929
    expect(await this.vault.totalSupply()).to.be.bignumber.equal('9333');
    expect(await this.vault.totalAssets()).to.be.bignumber.equal('17000'); // used to be 17001

    // 7. Alice redeem 1333 shares (2428 assets)
    {
      const { tx } = await this.vault.redeem(1333, user1, user1, { from: user1 });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user1,
        to: constants.ZERO_ADDRESS,
        value: '1333',
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user1,
        value: '2427', // used to be 2428
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('2000');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('6000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('3643');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('10929');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('8000');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('14573');
    }

    // 8. Bob withdraws 2929 assets (1608 shares)
    {
      const { tx } = await this.vault.withdraw(2929, user2, user2, { from: user2 });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user2,
        to: constants.ZERO_ADDRESS,
        value: '1608',
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user2,
        value: '2929',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('2000');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4392');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('3643');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('8000');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('6392');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('11644');
    }

    // 9. Alice withdraws 3643 assets (2000 shares)
    // NOTE: Bob's assets have been rounded back up
    {
      const { tx } = await this.vault.withdraw(3643, user1, user1, { from: user1 });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user1,
        to: constants.ZERO_ADDRESS,
        value: '2000',
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user1,
        value: '3643',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('0');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4392');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('8000'); // used to be 8001
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('4392');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('8001');
    }

    // 10. Bob redeem 4392 shares (8001 tokens)
    {
      const { tx } = await this.vault.redeem(4392, user2, user2, { from: user2 });
      await expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user2,
        to: constants.ZERO_ADDRESS,
        value: '4392',
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user2,
        value: '8000', // used to be 8001
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('0');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('0');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('0');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('1'); // used to be 0
    }
  });
});
