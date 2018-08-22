const { shouldBehaveLikeMintedCrowdsale } = require('./MintedCrowdsale.behavior');
const { ether } = require('../helpers/ether');

const BigNumber = web3.BigNumber;

const MintedCrowdsale = artifacts.require('MintedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken');

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
      (await this.token.owner()).should.eq(this.crowdsale.address);
    });

    shouldBehaveLikeMintedCrowdsale([_, investor, wallet, purchaser], rate, value);
  });
});
