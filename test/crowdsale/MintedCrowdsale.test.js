const { shouldBehaveLikeMintedCrowdsale } = require('./MintedCrowdsale.behavior');
const { ether } = require('../helpers/ether');
const { assertRevert } = require('../helpers/assertRevert');

const BigNumber = web3.BigNumber;

const MintedCrowdsale = artifacts.require('MintedCrowdsaleImpl');
const ERC20Mintable = artifacts.require('ERC20Mintable');
const ERC20 = artifacts.require('ERC20');

contract('MintedCrowdsale', function ([_, deployer, investor, wallet, purchaser]) {
  const rate = new BigNumber(1000);
  const value = ether(5);

  describe('using ERC20Mintable', function () {
    beforeEach(async function () {
      this.token = await ERC20Mintable.new({ from: deployer });
      this.crowdsale = await MintedCrowdsale.new(rate, wallet, this.token.address);

      await this.token.addMinter(this.crowdsale.address, { from: deployer });
      await this.token.renounceMinter({ from: deployer });
    });

    it('crowdsale should be minter', async function () {
      (await this.token.isMinter(this.crowdsale.address)).should.equal(true);
    });

    shouldBehaveLikeMintedCrowdsale([_, investor, wallet, purchaser], rate, value);
  });

  describe('using non-mintable token', function () {
    beforeEach(async function () {
      this.token = await ERC20.new();
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
