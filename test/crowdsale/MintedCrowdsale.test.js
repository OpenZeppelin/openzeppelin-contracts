const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { shouldBehaveLikeMintedCrowdsale } = require('./MintedCrowdsale.behavior');

const { expect } = require('chai');

const MintedCrowdsaleImpl = load.truffle('MintedCrowdsaleImpl');
const ERC20Mintable = load.truffle('ERC20Mintable');
const ERC20 = load.truffle('ERC20');

describe('MintedCrowdsale', function ([_, deployer, investor, wallet, purchaser]) {
  const rate = new BN('1000');
  const value = ether('5');

  describe('using ERC20Mintable', function () {
    beforeEach(async function () {
      this.token = await ERC20Mintable.new({ from: deployer });
      this.crowdsale = await MintedCrowdsaleImpl.new(rate, wallet, this.token.address);

      await this.token.addMinter(this.crowdsale.address, { from: deployer });
      await this.token.renounceMinter({ from: deployer });
    });

    it('crowdsale should be minter', async function () {
      expect(await this.token.isMinter(this.crowdsale.address)).to.equal(true);
    });

    shouldBehaveLikeMintedCrowdsale([_, investor, wallet, purchaser], rate, value);
  });

  describe('using non-mintable token', function () {
    beforeEach(async function () {
      this.token = await ERC20.new();
      this.crowdsale = await MintedCrowdsaleImpl.new(rate, wallet, this.token.address);
    });

    it('rejects bare payments', async function () {
      await expectRevert.unspecified(this.crowdsale.send(value));
    });

    it('rejects token purchases', async function () {
      await expectRevert.unspecified(this.crowdsale.buyTokens(investor, { value: value, from: purchaser }));
    });
  });
});
