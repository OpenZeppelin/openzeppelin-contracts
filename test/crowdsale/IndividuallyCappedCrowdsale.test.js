import ether from '../helpers/ether';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CappedCrowdsale = artifacts.require('IndividuallyCappedCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('IndividuallyCappedCrowdsale', function ([_, wallet, alice, bob, charlie]) {
  const rate = new BigNumber(1);
  const capAlice = ether(10);
  const capBob = ether(2);
  const lessThanCapAlice = ether(6);
  const lessThanCapBoth = ether(1);
  const tokenSupply = new BigNumber('1e22');

  describe('individual capping', function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
      this.crowdsale = await CappedCrowdsale.new(rate, wallet, this.token.address);
      this.crowdsale.setUserCap(alice, capAlice);
      this.crowdsale.setUserCap(bob, capBob);
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice }).should.be.fulfilled;
        await this.crowdsale.buyTokens(bob, { value: lessThanCapBoth }).should.be.fulfilled;
      });

      it('should reject payments outside cap', async function () {
        await this.crowdsale.buyTokens(alice, { value: capAlice });
        await this.crowdsale.buyTokens(alice, { value: 1 }).should.be.rejectedWith(EVMRevert);
      });

      it('should reject payments that exceed cap', async function () {
        await this.crowdsale.buyTokens(alice, { value: capAlice.plus(1) }).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(bob, { value: capBob.plus(1) }).should.be.rejectedWith(EVMRevert);
      });

      it('should manage independent caps', async function () {
        await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice }).should.be.fulfilled;
        await this.crowdsale.buyTokens(bob, { value: lessThanCapAlice }).should.be.rejectedWith(EVMRevert);
      });

      it('should default to a cap of zero', async function () {
        await this.crowdsale.buyTokens(charlie, { value: lessThanCapBoth }).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('reporting state', function () {
      it('should report correct cap', async function () {
        let retrievedCap = await this.crowdsale.getUserCap(alice);
        retrievedCap.should.be.bignumber.equal(capAlice);
      });

      it('should report actual contribution', async function () {
        await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice });
        let retrievedContribution = await this.crowdsale.getUserContribution(alice);
        retrievedContribution.should.be.bignumber.equal(lessThanCapAlice);
      });
    });
  });

  describe('group capping', function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
      this.crowdsale = await CappedCrowdsale.new(rate, wallet, this.token.address);
      this.crowdsale.setGroupCap([bob, charlie], capBob);
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.buyTokens(bob, { value: lessThanCapBoth }).should.be.fulfilled;
        await this.crowdsale.buyTokens(charlie, { value: lessThanCapBoth }).should.be.fulfilled;
      });

      it('should reject payments outside cap', async function () {
        await this.crowdsale.buyTokens(bob, { value: capBob });
        await this.crowdsale.buyTokens(bob, { value: 1 }).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(charlie, { value: capBob });
        await this.crowdsale.buyTokens(charlie, { value: 1 }).should.be.rejectedWith(EVMRevert);
      });

      it('should reject payments that exceed cap', async function () {
        await this.crowdsale.buyTokens(bob, { value: capBob.plus(1) }).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(charlie, { value: capBob.plus(1) }).should.be.rejectedWith(EVMRevert);
      });
    });

    describe('reporting state', function () {
      it('should report correct cap', async function () {
        let retrievedCapBob = await this.crowdsale.getUserCap(bob);
        retrievedCapBob.should.be.bignumber.equal(capBob);
        let retrievedCapCharlie = await this.crowdsale.getUserCap(charlie);
        retrievedCapCharlie.should.be.bignumber.equal(capBob);
      });
    });
  });
});
