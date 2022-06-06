const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC20DecimalsMock = artifacts.require('ERC20DecimalsMock');
const ERC20TokenizedVaultMock = artifacts.require('ERC20TokenizedVaultMock');

const parseToken = (token) => (new BN(token)).mul(new BN('1000000000000'));
const parseShare = (share) => (new BN(share)).mul(new BN('1000000000000000000'));

contract('ERC20TokenizedVault', function (accounts) {
  const [ holder, recipient, spender, other, user1, user2 ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  beforeEach(async function () {
    this.token = await ERC20DecimalsMock.new(name, symbol, 12);
    this.vault = await ERC20TokenizedVaultMock.new(this.token.address, name + ' Vault', symbol + 'V');

    await this.token.mint(holder, web3.utils.toWei('100'));
    await this.token.approve(this.vault.address, constants.MAX_UINT256, { from: holder });
    await this.vault.approve(spender, constants.MAX_UINT256, { from: holder });
  });

  it('metadata', async function () {
    expect(await this.vault.name()).to.be.equal(name + ' Vault');
    expect(await this.vault.symbol()).to.be.equal(symbol + 'V');
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

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(1),
      });
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(parseShare(1))).to.be.bignumber.equal(parseToken(1));

      const { tx } = await this.vault.mint(parseShare(1), recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(1),
      });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.withdraw('0', recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: '0',
      });
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewRedeem('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.redeem('0', recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: '0',
      });
    });
  });

  describe('partially empty vault: assets & no shares', function () {
    beforeEach(async function () {
      await this.token.mint(this.vault.address, parseToken(1)); // 1 token
    });

    it('status', async function () {
      expect(await this.vault.totalAssets()).to.be.bignumber.equal(parseToken(1));
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewDeposit(parseToken(1))).to.be.bignumber.equal(parseShare(1));

      const { tx } = await this.vault.deposit(parseToken(1), recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(1),
      });
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(parseShare(1))).to.be.bignumber.equal(parseToken(1));

      const { tx } = await this.vault.mint(parseShare(1), recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(1),
      });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.withdraw('0', recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: '0',
      });
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewRedeem('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.redeem('0', recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: '0',
      });
    });
  });

  describe('partially empty vault: shares & no assets', function () {
    beforeEach(async function () {
      await this.vault.mockMint(holder, parseShare(1)); // 1 share
    });

    it('status', async function () {
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('0');
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal('0');

      // Can deposit 0 (max deposit)
      const { tx } = await this.vault.deposit(0, recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: 0,
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: 0,
      });

      // Cannot deposit more than 0
      await expectRevert.unspecified(this.vault.previewDeposit(parseToken(1)));
      await expectRevert(
        this.vault.deposit(parseToken(1), recipient, { from: holder }),
        'ERC20TokenizedVault: deposit more than max',
      );
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(parseShare(1))).to.be.bignumber.equal('0');

      const { tx } = await this.vault.mint(parseShare(1), recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(1),
      });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');
      await expectRevert.unspecified(this.vault.previewWithdraw('1'));

      const { tx } = await this.vault.withdraw('0', recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: '0',
      });
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal(parseShare(1));
      expect(await this.vault.previewRedeem(parseShare(1))).to.be.bignumber.equal('0');

      const { tx } = await this.vault.redeem(parseShare(1), recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: '0',
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: parseShare(1),
      });
    });
  });

  describe('full vault: assets & shares', function () {
    beforeEach(async function () {
      await this.token.mint(this.vault.address, parseToken(1)); // 1 tokens
      await this.vault.mockMint(holder, parseShare(100)); // 100 share
    });

    it('status', async function () {
      expect(await this.vault.totalAssets()).to.be.bignumber.equal(parseToken(1));
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewDeposit(parseToken(1))).to.be.bignumber.equal(parseShare(100));

      const { tx } = await this.vault.deposit(parseToken(1), recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(100),
      });
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(parseShare(1))).to.be.bignumber.equal(parseToken(1).divn(100));

      const { tx } = await this.vault.mint(parseShare(1), recipient, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: holder,
        to: this.vault.address,
        value: parseToken(1).divn(100),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: recipient,
        value: parseShare(1),
      });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal(parseToken(1));
      expect(await this.vault.previewWithdraw(parseToken(1))).to.be.bignumber.equal(parseShare(100));

      const { tx } = await this.vault.withdraw(parseToken(1), recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: parseShare(100),
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
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal(parseShare(100));
      expect(await this.vault.previewRedeem(parseShare(100))).to.be.bignumber.equal(parseToken(1));

      const { tx } = await this.vault.redeem(parseShare(100), recipient, holder, { from: holder });

      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: recipient,
        value: parseToken(1),
      });

      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: holder,
        to: constants.ZERO_ADDRESS,
        value: parseShare(100),
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

  /// Scenario inspired by solmate ERC4626 tests:
  /// https://github.com/Rari-Capital/solmate/blob/main/src/test/ERC4626.t.sol
  it('multiple mint, deposit, redeem & withdrawal', async function () {
    // test designed with both asset using similar decimals
    this.token = await ERC20DecimalsMock.new(name, symbol, 18);
    this.vault = await ERC20TokenizedVaultMock.new(this.token.address, name + ' Vault', symbol + 'V');

    await this.token.mint(user1, 4000);
    await this.token.mint(user2, 7001);
    await this.token.approve(this.vault.address, 4000, { from: user1 });
    await this.token.approve(this.vault.address, 7001, { from: user2 });

    // 1. Alice mints 2000 shares (costs 2000 tokens)
    {
      const { tx } = await this.vault.mint(2000, user1, { from: user1 });
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user1,
        to: this.vault.address,
        value: '2000',
      });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
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
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user2,
        to: this.vault.address,
        value: '4000',
      });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
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
    await this.token.mint(this.vault.address, 3000);

    expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('2000');
    expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4000');
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('3000');
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('6000');
    expect(await this.vault.totalSupply()).to.be.bignumber.equal('6000');
    expect(await this.vault.totalAssets()).to.be.bignumber.equal('9000');

    // 4. Alice deposits 2000 tokens (mints 1333 shares)
    {
      const { tx } = await this.vault.deposit(2000, user1, { from: user1 });
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user1,
        to: this.vault.address,
        value: '2000',
      });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
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
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: user2,
        to: this.vault.address,
        value: '3001',
      });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: user2,
        value: '2000',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('3333');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('6000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('5000');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('9000');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('9333');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('14001');
    }

    // 6. Vault mutates by +3000 tokens
    // NOTE: Vault holds 17001 tokens, but sum of assetsOf() is 17000.
    await this.token.mint(this.vault.address, 3000);

    expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('3333');
    expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('6000');
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('6071');
    expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('10929');
    expect(await this.vault.totalSupply()).to.be.bignumber.equal('9333');
    expect(await this.vault.totalAssets()).to.be.bignumber.equal('17001');

    // 7. Alice redeem 1333 shares (2428 assets)
    {
      const { tx } = await this.vault.redeem(1333, user1, user1, { from: user1 });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user1,
        to: constants.ZERO_ADDRESS,
        value: '1333',
      });
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user1,
        value: '2428',
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
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user2,
        to: constants.ZERO_ADDRESS,
        value: '1608',
      });
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
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
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user1,
        to: constants.ZERO_ADDRESS,
        value: '2000',
      });
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user1,
        value: '3643',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('0');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('4392');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('8001');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('4392');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('8001');
    }

    // 10. Bob redeem 4392 shares (8001 tokens)
    {
      const { tx } = await this.vault.redeem(4392, user2, user2, { from: user2 });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', {
        from: user2,
        to: constants.ZERO_ADDRESS,
        value: '4392',
      });
      expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vault.address,
        to: user2,
        value: '8001',
      });

      expect(await this.vault.balanceOf(user1)).to.be.bignumber.equal('0');
      expect(await this.vault.balanceOf(user2)).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user1))).to.be.bignumber.equal('0');
      expect(await this.vault.convertToAssets(await this.vault.balanceOf(user2))).to.be.bignumber.equal('0');
      expect(await this.vault.totalSupply()).to.be.bignumber.equal('0');
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('0');
    }
  });
});
