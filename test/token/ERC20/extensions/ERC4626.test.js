const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

const { Enum } = require('../../../helpers/enums');

const name = 'My Token';
const symbol = 'MTKN';
const decimals = 18n;

async function fixture() {
  const [holder, recipient, spender, other, ...accounts] = await ethers.getSigners();
  return { holder, recipient, spender, other, accounts };
}

describe('ERC4626', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('inherit decimals if from asset', async function () {
    for (const decimals of [0n, 9n, 12n, 18n, 36n]) {
      const token = await ethers.deployContract('$ERC20DecimalsMock', ['', '', decimals]);
      const vault = await ethers.deployContract('$ERC4626', ['', '', token]);
      expect(await vault.decimals()).to.equal(decimals);
    }
  });

  it('asset has not yet been created', async function () {
    const vault = await ethers.deployContract('$ERC4626', ['', '', this.other.address]);
    expect(await vault.decimals()).to.equal(decimals);
  });

  it('underlying excess decimals', async function () {
    const token = await ethers.deployContract('$ERC20ExcessDecimalsMock');
    const vault = await ethers.deployContract('$ERC4626', ['', '', token]);
    expect(await vault.decimals()).to.equal(decimals);
  });

  it('decimals overflow', async function () {
    for (const offset of [243n, 250n, 255n]) {
      const token = await ethers.deployContract('$ERC20DecimalsMock', ['', '', decimals]);
      const vault = await ethers.deployContract('$ERC4626OffsetMock', ['', '', token, offset]);
      await expect(vault.decimals()).to.be.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW);
    }
  });

  describe('reentrancy', function () {
    const reenterType = Enum('No', 'Before', 'After');

    const value = 1_000_000_000_000_000_000n;
    const reenterValue = 1_000_000_000n;

    beforeEach(async function () {
      // Use offset 1 so the rate is not 1:1 and we can't possibly confuse assets and shares
      const token = await ethers.deployContract('$ERC20Reentrant');
      const vault = await ethers.deployContract('$ERC4626OffsetMock', ['', '', token, 1n]);
      // Funds and approval for tests
      await token.$_mint(this.holder, value);
      await token.$_mint(this.other, value);
      await token.$_approve(this.holder, vault, ethers.MaxUint256);
      await token.$_approve(this.other, vault, ethers.MaxUint256);
      await token.$_approve(token, vault, ethers.MaxUint256);

      Object.assign(this, { token, vault });
    });

    // During a `_deposit`, the vault does `transferFrom(depositor, vault, assets)` -> `_mint(receiver, shares)`
    // such that a reentrancy BEFORE the transfer guarantees the price is kept the same.
    // If the order of transfer -> mint is changed to mint -> transfer, the reentrancy could be triggered on an
    // intermediate state in which the ratio of assets/shares has been decreased (more shares than assets).
    it('correct share price is observed during reentrancy before deposit', async function () {
      // mint token for deposit
      await this.token.$_mint(this.token, reenterValue);

      // Schedules a reentrancy from the token contract
      await this.token.scheduleReenter(
        reenterType.Before,
        this.vault,
        this.vault.interface.encodeFunctionData('deposit', [reenterValue, this.holder.address]),
      );

      // Initial share price
      const sharesForDeposit = await this.vault.previewDeposit(value);
      const sharesForReenter = await this.vault.previewDeposit(reenterValue);

      await expect(this.vault.connect(this.holder).deposit(value, this.holder))
        // Deposit normally, reentering before the internal `_update`
        .to.emit(this.vault, 'Deposit')
        .withArgs(this.holder, this.holder, value, sharesForDeposit)
        // Reentrant deposit event → uses the same price
        .to.emit(this.vault, 'Deposit')
        .withArgs(this.token, this.holder, reenterValue, sharesForReenter);

      // Assert prices is kept
      expect(await this.vault.previewDeposit(value)).to.equal(sharesForDeposit);
    });

    // During a `_withdraw`, the vault does `_burn(owner, shares)` -> `transfer(receiver, assets)`
    // such that a reentrancy AFTER the transfer guarantees the price is kept the same.
    // If the order of burn -> transfer is changed to transfer -> burn, the reentrancy could be triggered on an
    // intermediate state in which the ratio of shares/assets has been decreased (more assets than shares).
    it('correct share price is observed during reentrancy after withdraw', async function () {
      // Deposit into the vault: holder gets `value` share, token.address gets `reenterValue` shares
      await this.vault.connect(this.holder).deposit(value, this.holder);
      await this.vault.connect(this.other).deposit(reenterValue, this.token);

      // Schedules a reentrancy from the token contract
      await this.token.scheduleReenter(
        reenterType.After,
        this.vault,
        this.vault.interface.encodeFunctionData('withdraw', [reenterValue, this.holder.address, this.token.target]),
      );

      // Initial share price
      const sharesForWithdraw = await this.vault.previewWithdraw(value);
      const sharesForReenter = await this.vault.previewWithdraw(reenterValue);

      // Do withdraw normally, triggering the _afterTokenTransfer hook
      await expect(this.vault.connect(this.holder).withdraw(value, this.holder, this.holder))
        // Main withdraw event
        .to.emit(this.vault, 'Withdraw')
        .withArgs(this.holder, this.holder, this.holder, value, sharesForWithdraw)
        // Reentrant withdraw event → uses the same price
        .to.emit(this.vault, 'Withdraw')
        .withArgs(this.token, this.holder, this.token, reenterValue, sharesForReenter);

      // Assert price is kept
      expect(await this.vault.previewWithdraw(value)).to.equal(sharesForWithdraw);
    });

    // Donate newly minted tokens to the vault during the reentrancy causes the share price to increase.
    // Still, the deposit that trigger the reentrancy is not affected and get the previewed price.
    // Further deposits will get a different price (getting fewer shares for the same value of assets)
    it('share price change during reentrancy does not affect deposit', async function () {
      // Schedules a reentrancy from the token contract that mess up the share price
      await this.token.scheduleReenter(
        reenterType.Before,
        this.token,
        this.token.interface.encodeFunctionData('$_mint', [this.vault.target, reenterValue]),
      );

      // Price before
      const sharesBefore = await this.vault.previewDeposit(value);

      // Deposit, reentering before the internal `_update`
      await expect(this.vault.connect(this.holder).deposit(value, this.holder))
        // Price is as previewed
        .to.emit(this.vault, 'Deposit')
        .withArgs(this.holder, this.holder, value, sharesBefore);

      // Price was modified during reentrancy
      expect(await this.vault.previewDeposit(value)).to.lt(sharesBefore);
    });

    // Burn some tokens from the vault during the reentrancy causes the share price to drop.
    // Still, the withdraw that trigger the reentrancy is not affected and get the previewed price.
    // Further withdraw will get a different price (needing more shares for the same value of assets)
    it('share price change during reentrancy does not affect withdraw', async function () {
      await this.vault.connect(this.holder).deposit(value, this.holder);
      await this.vault.connect(this.other).deposit(value, this.other);

      // Schedules a reentrancy from the token contract that mess up the share price
      await this.token.scheduleReenter(
        reenterType.After,
        this.token,
        this.token.interface.encodeFunctionData('$_burn', [this.vault.target, reenterValue]),
      );

      // Price before
      const sharesBefore = await this.vault.previewWithdraw(value);

      // Withdraw, triggering the _afterTokenTransfer hook
      await expect(this.vault.connect(this.holder).withdraw(value, this.holder, this.holder))
        // Price is as previewed
        .to.emit(this.vault, 'Withdraw')
        .withArgs(this.holder, this.holder, this.holder, value, sharesBefore);

      // Price was modified during reentrancy
      expect(await this.vault.previewWithdraw(value)).to.gt(sharesBefore);
    });
  });

  describe('limits', function () {
    beforeEach(async function () {
      const token = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, decimals]);
      const vault = await ethers.deployContract('$ERC4626LimitsMock', ['', '', token]);

      Object.assign(this, { token, vault });
    });

    it('reverts on deposit() above max deposit', async function () {
      const maxDeposit = await this.vault.maxDeposit(this.holder);
      await expect(this.vault.connect(this.holder).deposit(maxDeposit + 1n, this.recipient))
        .to.be.revertedWithCustomError(this.vault, 'ERC4626ExceededMaxDeposit')
        .withArgs(this.recipient, maxDeposit + 1n, maxDeposit);
    });

    it('reverts on mint() above max mint', async function () {
      const maxMint = await this.vault.maxMint(this.holder);

      await expect(this.vault.connect(this.holder).mint(maxMint + 1n, this.recipient))
        .to.be.revertedWithCustomError(this.vault, 'ERC4626ExceededMaxMint')
        .withArgs(this.recipient, maxMint + 1n, maxMint);
    });

    it('reverts on withdraw() above max withdraw', async function () {
      const maxWithdraw = await this.vault.maxWithdraw(this.holder);

      await expect(this.vault.connect(this.holder).withdraw(maxWithdraw + 1n, this.recipient, this.holder))
        .to.be.revertedWithCustomError(this.vault, 'ERC4626ExceededMaxWithdraw')
        .withArgs(this.holder, maxWithdraw + 1n, maxWithdraw);
    });

    it('reverts on redeem() above max redeem', async function () {
      const maxRedeem = await this.vault.maxRedeem(this.holder);

      await expect(this.vault.connect(this.holder).redeem(maxRedeem + 1n, this.recipient, this.holder))
        .to.be.revertedWithCustomError(this.vault, 'ERC4626ExceededMaxRedeem')
        .withArgs(this.holder, maxRedeem + 1n, maxRedeem);
    });
  });

  for (const offset of [0n, 6n, 18n]) {
    const parseToken = token => token * 10n ** decimals;
    const parseShare = share => share * 10n ** (decimals + offset);

    const virtualAssets = 1n;
    const virtualShares = 10n ** offset;

    describe(`offset: ${offset}`, function () {
      beforeEach(async function () {
        const token = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, decimals]);
        const vault = await ethers.deployContract('$ERC4626OffsetMock', [name + ' Vault', symbol + 'V', token, offset]);

        await token.$_mint(this.holder, ethers.MaxUint256 / 2n); // 50% of maximum
        await token.$_approve(this.holder, vault, ethers.MaxUint256);
        await vault.$_approve(this.holder, this.spender, ethers.MaxUint256);

        Object.assign(this, { token, vault });
      });

      it('metadata', async function () {
        expect(await this.vault.name()).to.equal(name + ' Vault');
        expect(await this.vault.symbol()).to.equal(symbol + 'V');
        expect(await this.vault.decimals()).to.equal(decimals + offset);
        expect(await this.vault.asset()).to.equal(this.token);
      });

      describe('empty vault: no assets & no shares', function () {
        it('status', async function () {
          expect(await this.vault.totalAssets()).to.equal(0n);
        });

        it('deposit', async function () {
          expect(await this.vault.maxDeposit(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewDeposit(parseToken(1n))).to.equal(parseShare(1n));

          const tx = this.vault.connect(this.holder).deposit(parseToken(1n), this.recipient);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.holder, this.vault],
            [-parseToken(1n), parseToken(1n)],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, parseShare(1n));
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.vault, parseToken(1n))
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, parseShare(1n))
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, parseToken(1n), parseShare(1n));
        });

        it('mint', async function () {
          expect(await this.vault.maxMint(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewMint(parseShare(1n))).to.equal(parseToken(1n));

          const tx = this.vault.connect(this.holder).mint(parseShare(1n), this.recipient);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.holder, this.vault],
            [-parseToken(1n), parseToken(1n)],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, parseShare(1n));
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.vault, parseToken(1n))
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, parseShare(1n))
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, parseToken(1n), parseShare(1n));
        });

        it('withdraw', async function () {
          expect(await this.vault.maxWithdraw(this.holder)).to.equal(0n);
          expect(await this.vault.previewWithdraw(0n)).to.equal(0n);

          const tx = this.vault.connect(this.holder).withdraw(0n, this.recipient, this.holder);

          await expect(tx).to.changeTokenBalances(this.token, [this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.vault, this.recipient, 0n)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });

        it('redeem', async function () {
          expect(await this.vault.maxRedeem(this.holder)).to.equal(0n);
          expect(await this.vault.previewRedeem(0n)).to.equal(0n);

          const tx = this.vault.connect(this.holder).redeem(0n, this.recipient, this.holder);

          await expect(tx).to.changeTokenBalances(this.token, [this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.vault, this.recipient, 0n)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });
      });

      describe('inflation attack: offset price by direct deposit of assets', function () {
        beforeEach(async function () {
          // Donate 1 token to the vault to offset the price
          await this.token.$_mint(this.vault, parseToken(1n));
        });

        it('status', async function () {
          expect(await this.vault.totalSupply()).to.equal(0n);
          expect(await this.vault.totalAssets()).to.equal(parseToken(1n));
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
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const depositAssets = parseToken(1n);
          const expectedShares = (depositAssets * effectiveShares) / effectiveAssets;

          expect(await this.vault.maxDeposit(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewDeposit(depositAssets)).to.equal(expectedShares);

          const tx = this.vault.connect(this.holder).deposit(depositAssets, this.recipient);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.holder, this.vault],
            [-depositAssets, depositAssets],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, expectedShares);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.vault, depositAssets)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, expectedShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAssets, expectedShares);
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
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const mintShares = parseShare(1n);
          const expectedAssets = (mintShares * effectiveAssets) / effectiveShares;

          expect(await this.vault.maxMint(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewMint(mintShares)).to.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).mint(mintShares, this.recipient);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.holder, this.vault],
            [-expectedAssets, expectedAssets],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, mintShares);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.vault, expectedAssets)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, mintShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, expectedAssets, mintShares);
        });

        it('withdraw', async function () {
          expect(await this.vault.maxWithdraw(this.holder)).to.equal(0n);
          expect(await this.vault.previewWithdraw(0n)).to.equal(0n);

          const tx = this.vault.connect(this.holder).withdraw(0n, this.recipient, this.holder);

          await expect(tx).to.changeTokenBalances(this.token, [this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.vault, this.recipient, 0n)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });

        it('redeem', async function () {
          expect(await this.vault.maxRedeem(this.holder)).to.equal(0n);
          expect(await this.vault.previewRedeem(0n)).to.equal(0n);

          const tx = this.vault.connect(this.holder).redeem(0n, this.recipient, this.holder);

          await expect(tx).to.changeTokenBalances(this.token, [this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.vault, this.recipient, 0n)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });
      });

      describe('full vault: assets & shares', function () {
        beforeEach(async function () {
          // Add 1 token of underlying asset and 100 shares to the vault
          await this.token.$_mint(this.vault, parseToken(1n));
          await this.vault.$_mint(this.holder, parseShare(100n));
        });

        it('status', async function () {
          expect(await this.vault.totalSupply()).to.equal(parseShare(100n));
          expect(await this.vault.totalAssets()).to.equal(parseToken(1n));
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
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const depositAssets = parseToken(1n);
          const expectedShares = (depositAssets * effectiveShares) / effectiveAssets;

          expect(await this.vault.maxDeposit(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewDeposit(depositAssets)).to.equal(expectedShares);

          const tx = this.vault.connect(this.holder).deposit(depositAssets, this.recipient);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.holder, this.vault],
            [-depositAssets, depositAssets],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, expectedShares);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.vault, depositAssets)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, expectedShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAssets, expectedShares);
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
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const mintShares = parseShare(1n);
          const expectedAssets = (mintShares * effectiveAssets) / effectiveShares + 1n; // add for the rounding

          expect(await this.vault.maxMint(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewMint(mintShares)).to.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).mint(mintShares, this.recipient);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.holder, this.vault],
            [-expectedAssets, expectedAssets],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, mintShares);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.holder, this.vault, expectedAssets)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, mintShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, expectedAssets, mintShares);
        });

        it('withdraw', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const withdrawAssets = parseToken(1n);
          const expectedShares = (withdrawAssets * effectiveShares) / effectiveAssets + 1n; // add for the rounding

          expect(await this.vault.maxWithdraw(this.holder)).to.equal(withdrawAssets);
          expect(await this.vault.previewWithdraw(withdrawAssets)).to.equal(expectedShares);

          const tx = this.vault.connect(this.holder).withdraw(withdrawAssets, this.recipient, this.holder);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.vault, this.recipient],
            [-withdrawAssets, withdrawAssets],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, -expectedShares);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.vault, this.recipient, withdrawAssets)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, expectedShares)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, withdrawAssets, expectedShares);
        });

        it('withdraw with approval', async function () {
          const assets = await this.vault.previewWithdraw(parseToken(1n));

          await expect(this.vault.connect(this.other).withdraw(parseToken(1n), this.recipient, this.holder))
            .to.be.revertedWithCustomError(this.vault, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, assets);

          await expect(this.vault.connect(this.spender).withdraw(parseToken(1n), this.recipient, this.holder)).to.not.be
            .reverted;
        });

        it('redeem', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const redeemShares = parseShare(100n);
          const expectedAssets = (redeemShares * effectiveAssets) / effectiveShares;

          expect(await this.vault.maxRedeem(this.holder)).to.equal(redeemShares);
          expect(await this.vault.previewRedeem(redeemShares)).to.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).redeem(redeemShares, this.recipient, this.holder);

          await expect(tx).to.changeTokenBalances(
            this.token,
            [this.vault, this.recipient],
            [-expectedAssets, expectedAssets],
          );
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, -redeemShares);
          await expect(tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.vault, this.recipient, expectedAssets)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, redeemShares)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, expectedAssets, redeemShares);
        });

        it('redeem with approval', async function () {
          await expect(this.vault.connect(this.other).redeem(parseShare(100n), this.recipient, this.holder))
            .to.be.revertedWithCustomError(this.vault, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, parseShare(100n));

          await expect(this.vault.connect(this.spender).redeem(parseShare(100n), this.recipient, this.holder)).to.not.be
            .reverted;
        });
      });
    });
  }

  describe('ERC4626Fees', function () {
    const feeBasisPoints = 500n; // 5%
    const valueWithoutFees = 10_000n;
    const fees = (valueWithoutFees * feeBasisPoints) / 10_000n;
    const valueWithFees = valueWithoutFees + fees;

    describe('input fees', function () {
      beforeEach(async function () {
        const token = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, 18n]);
        const vault = await ethers.deployContract('$ERC4626FeesMock', [
          '',
          '',
          token,
          feeBasisPoints,
          this.other,
          0n,
          ethers.ZeroAddress,
        ]);

        await token.$_mint(this.holder, ethers.MaxUint256 / 2n);
        await token.$_approve(this.holder, vault, ethers.MaxUint256 / 2n);

        Object.assign(this, { token, vault });
      });

      it('deposit', async function () {
        expect(await this.vault.previewDeposit(valueWithFees)).to.equal(valueWithoutFees);
        this.tx = this.vault.connect(this.holder).deposit(valueWithFees, this.recipient);
      });

      it('mint', async function () {
        expect(await this.vault.previewMint(valueWithoutFees)).to.equal(valueWithFees);
        this.tx = this.vault.connect(this.holder).mint(valueWithoutFees, this.recipient);
      });

      afterEach(async function () {
        await expect(this.tx).to.changeTokenBalances(
          this.token,
          [this.holder, this.vault, this.other],
          [-valueWithFees, valueWithoutFees, fees],
        );
        await expect(this.tx).to.changeTokenBalance(this.vault, this.recipient, valueWithoutFees);
        await expect(this.tx)
          // get total
          .to.emit(this.token, 'Transfer')
          .withArgs(this.holder, this.vault, valueWithFees)
          // redirect fees
          .to.emit(this.token, 'Transfer')
          .withArgs(this.vault, this.other, fees)
          // mint shares
          .to.emit(this.vault, 'Transfer')
          .withArgs(ethers.ZeroAddress, this.recipient, valueWithoutFees)
          // deposit event
          .to.emit(this.vault, 'Deposit')
          .withArgs(this.holder, this.recipient, valueWithFees, valueWithoutFees);
      });
    });

    describe('output fees', function () {
      beforeEach(async function () {
        const token = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, 18n]);
        const vault = await ethers.deployContract('$ERC4626FeesMock', [
          '',
          '',
          token,
          0n,
          ethers.ZeroAddress,
          feeBasisPoints,
          this.other,
        ]);

        await token.$_mint(vault, ethers.MaxUint256 / 2n);
        await vault.$_mint(this.holder, ethers.MaxUint256 / 2n);

        Object.assign(this, { token, vault });
      });

      it('redeem', async function () {
        expect(await this.vault.previewRedeem(valueWithFees)).to.equal(valueWithoutFees);
        this.tx = this.vault.connect(this.holder).redeem(valueWithFees, this.recipient, this.holder);
      });

      it('withdraw', async function () {
        expect(await this.vault.previewWithdraw(valueWithoutFees)).to.equal(valueWithFees);
        this.tx = this.vault.connect(this.holder).withdraw(valueWithoutFees, this.recipient, this.holder);
      });

      afterEach(async function () {
        await expect(this.tx).to.changeTokenBalances(
          this.token,
          [this.vault, this.recipient, this.other],
          [-valueWithFees, valueWithoutFees, fees],
        );
        await expect(this.tx).to.changeTokenBalance(this.vault, this.holder, -valueWithFees);
        await expect(this.tx)
          // withdraw principal
          .to.emit(this.token, 'Transfer')
          .withArgs(this.vault, this.recipient, valueWithoutFees)
          // redirect fees
          .to.emit(this.token, 'Transfer')
          .withArgs(this.vault, this.other, fees)
          // mint shares
          .to.emit(this.vault, 'Transfer')
          .withArgs(this.holder, ethers.ZeroAddress, valueWithFees)
          // withdraw event
          .to.emit(this.vault, 'Withdraw')
          .withArgs(this.holder, this.recipient, this.holder, valueWithoutFees, valueWithFees);
      });
    });
  });

  /// Scenario inspired by solmate ERC4626 tests:
  /// https://github.com/transmissions11/solmate/blob/main/src/test/ERC4626.t.sol
  it('multiple mint, deposit, redeem & withdrawal', async function () {
    // test designed with both asset using similar decimals
    const [alice, bruce] = this.accounts;
    const token = await ethers.deployContract('$ERC20DecimalsMock', [name, symbol, 18n]);
    const vault = await ethers.deployContract('$ERC4626', ['', '', token]);

    await token.$_mint(alice, 4000n);
    await token.$_mint(bruce, 7001n);
    await token.connect(alice).approve(vault, 4000n);
    await token.connect(bruce).approve(vault, 7001n);

    // 1. Alice mints 2000 shares (costs 2000 tokens)
    await expect(vault.connect(alice).mint(2000n, alice))
      .to.emit(token, 'Transfer')
      .withArgs(alice, vault, 2000n)
      .to.emit(vault, 'Transfer')
      .withArgs(ethers.ZeroAddress, alice, 2000n);

    expect(await vault.previewDeposit(2000n)).to.equal(2000n);
    expect(await vault.balanceOf(alice)).to.equal(2000n);
    expect(await vault.balanceOf(bruce)).to.equal(0n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(2000n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(0n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(2000n);
    expect(await vault.totalSupply()).to.equal(2000n);
    expect(await vault.totalAssets()).to.equal(2000n);

    // 2. Bruce deposits 4000 tokens (mints 4000 shares)
    await expect(vault.connect(bruce).mint(4000n, bruce))
      .to.emit(token, 'Transfer')
      .withArgs(bruce, vault, 4000n)
      .to.emit(vault, 'Transfer')
      .withArgs(ethers.ZeroAddress, bruce, 4000n);

    expect(await vault.previewDeposit(4000n)).to.equal(4000n);
    expect(await vault.balanceOf(alice)).to.equal(2000n);
    expect(await vault.balanceOf(bruce)).to.equal(4000n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(2000n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(4000n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(6000n);
    expect(await vault.totalSupply()).to.equal(6000n);
    expect(await vault.totalAssets()).to.equal(6000n);

    // 3. Vault mutates by +3000 tokens (simulated yield returned from strategy)
    await token.$_mint(vault, 3000n);

    expect(await vault.balanceOf(alice)).to.equal(2000n);
    expect(await vault.balanceOf(bruce)).to.equal(4000n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(2999n); // used to be 3000, but virtual assets/shares captures part of the yield
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(5999n); // used to be 6000, but virtual assets/shares captures part of the yield
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(6000n);
    expect(await vault.totalSupply()).to.equal(6000n);
    expect(await vault.totalAssets()).to.equal(9000n);

    // 4. Alice deposits 2000 tokens (mints 1333 shares)
    await expect(vault.connect(alice).deposit(2000n, alice))
      .to.emit(token, 'Transfer')
      .withArgs(alice, vault, 2000n)
      .to.emit(vault, 'Transfer')
      .withArgs(ethers.ZeroAddress, alice, 1333n);

    expect(await vault.balanceOf(alice)).to.equal(3333n);
    expect(await vault.balanceOf(bruce)).to.equal(4000n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(4999n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(6000n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(7333n);
    expect(await vault.totalSupply()).to.equal(7333n);
    expect(await vault.totalAssets()).to.equal(11000n);

    // 5. Bruce mints 2000 shares (costs 3001 assets)
    // NOTE: Bruce's assets spent got rounded towards infinity
    // NOTE: Alices's vault assets got rounded towards infinity
    await expect(vault.connect(bruce).mint(2000n, bruce))
      .to.emit(token, 'Transfer')
      .withArgs(bruce, vault, 3000n)
      .to.emit(vault, 'Transfer')
      .withArgs(ethers.ZeroAddress, bruce, 2000n);

    expect(await vault.balanceOf(alice)).to.equal(3333n);
    expect(await vault.balanceOf(bruce)).to.equal(6000n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(4999n); // used to be 5000
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(9000n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(9333n);
    expect(await vault.totalSupply()).to.equal(9333n);
    expect(await vault.totalAssets()).to.equal(14000n); // used to be 14001

    // 6. Vault mutates by +3000 tokens
    // NOTE: Vault holds 17001 tokens, but sum of assetsOf() is 17000.
    await token.$_mint(vault, 3000n);

    expect(await vault.balanceOf(alice)).to.equal(3333n);
    expect(await vault.balanceOf(bruce)).to.equal(6000n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(6070n); // used to be 6071
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(10928n); // used to be 10929
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(9333n);
    expect(await vault.totalSupply()).to.equal(9333n);
    expect(await vault.totalAssets()).to.equal(17000n); // used to be 17001

    // 7. Alice redeem 1333 shares (2428 assets)
    await expect(vault.connect(alice).redeem(1333n, alice, alice))
      .to.emit(vault, 'Transfer')
      .withArgs(alice, ethers.ZeroAddress, 1333n)
      .to.emit(token, 'Transfer')
      .withArgs(vault, alice, 2427n); // used to be 2428

    expect(await vault.balanceOf(alice)).to.equal(2000n);
    expect(await vault.balanceOf(bruce)).to.equal(6000n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(3643n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(10929n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(8000n);
    expect(await vault.totalSupply()).to.equal(8000n);
    expect(await vault.totalAssets()).to.equal(14573n);

    // 8. Bruce withdraws 2929 assets (1608 shares)
    await expect(vault.connect(bruce).withdraw(2929n, bruce, bruce))
      .to.emit(vault, 'Transfer')
      .withArgs(bruce, ethers.ZeroAddress, 1608n)
      .to.emit(token, 'Transfer')
      .withArgs(vault, bruce, 2929n);

    expect(await vault.balanceOf(alice)).to.equal(2000n);
    expect(await vault.balanceOf(bruce)).to.equal(4392n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(3643n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(8000n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(6392n);
    expect(await vault.totalSupply()).to.equal(6392n);
    expect(await vault.totalAssets()).to.equal(11644n);

    // 9. Alice withdraws 3643 assets (2000 shares)
    // NOTE: Bruce's assets have been rounded back towards infinity
    await expect(vault.connect(alice).withdraw(3643n, alice, alice))
      .to.emit(vault, 'Transfer')
      .withArgs(alice, ethers.ZeroAddress, 2000n)
      .to.emit(token, 'Transfer')
      .withArgs(vault, alice, 3643n);

    expect(await vault.balanceOf(alice)).to.equal(0n);
    expect(await vault.balanceOf(bruce)).to.equal(4392n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(0n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(8000n); // used to be 8001
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(4392n);
    expect(await vault.totalSupply()).to.equal(4392n);
    expect(await vault.totalAssets()).to.equal(8001n);

    // 10. Bruce redeem 4392 shares (8001 tokens)
    await expect(vault.connect(bruce).redeem(4392n, bruce, bruce))
      .to.emit(vault, 'Transfer')
      .withArgs(bruce, ethers.ZeroAddress, 4392n)
      .to.emit(token, 'Transfer')
      .withArgs(vault, bruce, 8000n); // used to be 8001

    expect(await vault.balanceOf(alice)).to.equal(0n);
    expect(await vault.balanceOf(bruce)).to.equal(0n);
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(0n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(0n);
    expect(await vault.convertToShares(await token.balanceOf(vault))).to.equal(0n);
    expect(await vault.totalSupply()).to.equal(0n);
    expect(await vault.totalAssets()).to.equal(1n); // used to be 0
  });
});
