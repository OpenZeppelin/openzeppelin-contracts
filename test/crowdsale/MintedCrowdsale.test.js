const { shouldBehaveLikeMintedCrowdsale } = require('./MintedCrowdsale.behavior');
const { ether } = require('../helpers/ether');
const { assertRevert } = require('../helpers/assertRevert');

const BigNumber = web3.BigNumber;

const MintedCrowdsale = artifacts.require('MintedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken');
const RBACMintableToken = artifacts.require('RBACMintableToken');
const StandardToken = artifacts.require('StandardToken');

contract('MintedCrowdsale', function ([_, investor, wallet, purchaser]) {
  const rate = new BigNumber(1000);
  const value = ether(5);

  describe('using MintableToken', function () {
    beforeEach(async function () {
      this.token = await MintableToken.new();
      this.crowdsale = await MintedCrowdsale.new(rate, wallet, this.token.address);
      await this.token.transferOwnership(this.crowdsale.address);
    });

    it('should be token owner', async function () {
      (await this.token.owner()).should.equal(this.crowdsale.address);
    });

    shouldBehaveLikeMintedCrowdsale([_, investor, wallet, purchaser], rate, value);
  });

  describe('using RBACMintableToken', function () {
    const ROLE_MINTER = 'minter';

    beforeEach(async function () {
      this.token = await RBACMintableToken.new();
      this.crowdsale = await MintedCrowdsale.new(rate, wallet, this.token.address);
      await this.token.addMinter(this.crowdsale.address);
    });

    it('should have minter role on token', async function () {
      (await this.token.hasRole(this.crowdsale.address, ROLE_MINTER)).should.equal(true);
    });

    shouldBehaveLikeMintedCrowdsale([_, investor, wallet, purchaser], rate, value);
  });

  describe('using non-mintable token', function () {
    beforeEach(async function () {
      this.token = await StandardToken.new();
      this.crowdsale = await MintedCrowdsale.new(rate, wallet, this.token.address);
    });

    it('rejects bare payments', async function () {
      await assertRevert(this.crowdsale.send(value));
    });

    it('rejects token purchases', async function () {
      await assertRevert(this.crowdsale.buyTokens(investor, { value: value, from: purchaser }));
    });
  });
});
