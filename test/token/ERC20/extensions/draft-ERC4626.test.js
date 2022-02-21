const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC20DecimalsMock = artifacts.require('ERC20DecimalsMock');
const ERC4626Mock = artifacts.require('ERC4626Mock');

contract('ERC4626', function (accounts) {
  const [ holder, recipient, spender ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  const oneToken = new BN('1000000000000'); // 1e12
  const oneShare = new BN('1000000000000000000'); // 1e18

  beforeEach(async function () {
    this.token = await ERC20DecimalsMock.new(name, symbol, 12);
    this.vault = await ERC4626Mock.new(this.token.address, name + ' Vault', symbol+'V');

    await this.token.mint(holder, web3.utils.toWei('100'));
    await this.token.approve(this.vault.address, constants.MAX_UINT256, { from: holder });
    await this.vault.approve(spender, constants.MAX_UINT256, { from: holder });
  });

  it('metadata', async function () {
    expect(await this.vault.asset()).to.be.equal(this.token.address);
  });

  describe('empty vault: no asserts & no shares', function () {
    it('status', async function () {
      expect(await this.vault.totalAssets()).to.be.bignumber.equal('0');
      expect(await this.vault.assetsPerShare()).to.be.bignumber.equal(oneToken);
      expect(await this.vault.assetsOf(holder)).to.be.bignumber.equal('0');
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewDeposit(oneToken)).to.be.bignumber.equal(oneShare);

      const { tx } = await this.vault.deposit(oneToken, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare });
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(oneShare)).to.be.bignumber.equal(oneToken);

      const { tx } = await this.vault.mint(oneShare, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.withdraw('0', recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: '0' });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: '0' });
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewRedeem('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.redeem('0', recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: '0' });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: '0' });
    });
  });

  describe('partially empty vault: assets & no shares', function () {
    beforeEach(async function () {
      await this.token.mint(this.vault.address, oneToken); // 1 token
    });

    it('status', async function () {
      await expect(await this.vault.totalAssets()).to.be.bignumber.equal(oneToken);
      await expect(await this.vault.assetsPerShare()).to.be.bignumber.equal(oneToken);
      await expect(await this.vault.assetsOf(holder)).to.be.bignumber.equal('0');
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewDeposit(oneToken)).to.be.bignumber.equal(oneShare);

      const { tx } = await this.vault.deposit(oneToken, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare });
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(oneShare)).to.be.bignumber.equal(oneToken);

      const { tx } = await this.vault.mint(oneShare, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewWithdraw('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.withdraw('0', recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: '0' });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: '0' });
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal('0');
      expect(await this.vault.previewRedeem('0')).to.be.bignumber.equal('0');

      const { tx } = await this.vault.redeem('0', recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: '0' });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: '0' });
    });
  });

  describe.only('partially empty vault: shares & no assets', function () {
    beforeEach(async function () {
      await this.vault.__mint(holder, oneShare); // 1 share
    });

    it('status', async function () {
      await expect(await this.vault.totalAssets()).to.be.bignumber.equal('0');
      await expect(await this.vault.assetsPerShare()).to.be.bignumber.equal('0'); // shares are worth 0
      await expect(await this.vault.assetsOf(holder)).to.be.bignumber.equal('0');
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      await expectRevert.unspecified(this.vault.previewDeposit(oneToken));

      await expectRevert.unspecified(this.vault.deposit(oneToken, recipient, { from: holder }));
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(oneShare)).to.be.bignumber.equal('0');

      const { tx } = await this.vault.mint(oneShare, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: '0' });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal('0');
      await expectRevert.unspecified(this.vault.previewWithdraw('0'));

      await expectRevert.unspecified(this.vault.withdraw('0', recipient, holder, { from: spender }));
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal(oneShare);
      expect(await this.vault.previewRedeem(oneShare)).to.be.bignumber.equal('0');

      const { tx } = await this.vault.redeem(oneShare, recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: '0' });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: oneShare });
    });
  });

  describe('full vault: assets & shares', function () {
    beforeEach(async function () {
      await this.token.mint(this.vault.address, oneToken); // 1 tokens
      await this.vault.__mint(holder, oneShare.muln(100)); // 100 share
    });

    it('status', async function () {
      await expect(await this.vault.totalAssets()).to.be.bignumber.equal(oneToken);
      await expect(await this.vault.assetsPerShare()).to.be.bignumber.equal(oneToken.divn(100));
      await expect(await this.vault.assetsOf(holder)).to.be.bignumber.equal(oneToken);
    });

    it('deposit', async function () {
      expect(await this.vault.maxDeposit(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewDeposit(oneToken)).to.be.bignumber.equal(oneShare.muln(100));

      const { tx } = await this.vault.deposit(oneToken, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare.muln(100) });
    });

    it('mint', async function () {
      expect(await this.vault.maxMint(holder)).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(await this.vault.previewMint(oneShare)).to.be.bignumber.equal(oneToken.divn(100));

      const { tx } = await this.vault.mint(oneShare, recipient, { from: holder });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: holder, to: this.vault.address, value: oneToken.divn(100) });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: constants.ZERO_ADDRESS, to: recipient, value: oneShare });
    });

    it('withdraw', async function () {
      expect(await this.vault.maxWithdraw(holder)).to.be.bignumber.equal(oneToken);
      expect(await this.vault.previewWithdraw(oneToken)).to.be.bignumber.equal(oneShare.muln(100));

      const { tx } = await this.vault.withdraw(oneToken, recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: oneShare.muln(100) });
    });

    it('redeem', async function () {
      expect(await this.vault.maxRedeem(holder)).to.be.bignumber.equal(oneShare.muln(100));
      expect(await this.vault.previewRedeem(oneShare.muln(100))).to.be.bignumber.equal(oneToken);

      const { tx } = await this.vault.redeem(oneShare.muln(100), recipient, holder, { from: spender });
      expectEvent.inTransaction(tx, this.token, 'Transfer', { from: this.vault.address, to: recipient, value: oneToken });
      expectEvent.inTransaction(tx, this.vault, 'Transfer', { from: holder, to: constants.ZERO_ADDRESS, value: oneShare.muln(100) });
    });
  });
});
