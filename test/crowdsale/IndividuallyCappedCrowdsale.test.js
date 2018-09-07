const { ether } = require('../helpers/ether');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const IndividuallyCappedCrowdsaleImpl = artifacts.require('IndividuallyCappedCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');
const { shouldBehaveLikePublicRole } = require('../access/roles/PublicRole.behavior');

contract('IndividuallyCappedCrowdsale', function (
  [_, capper, otherCapper, wallet, alice, bob, charlie, anyone, ...otherAccounts]) {
  const rate = new BigNumber(1);
  const capAlice = ether(10);
  const capBob = ether(2);
  const lessThanCapAlice = ether(6);
  const lessThanCapBoth = ether(1);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await SimpleToken.new();
    this.crowdsale = await IndividuallyCappedCrowdsaleImpl.new(rate, wallet, this.token.address, { from: capper });
  });

  describe('capper role', function () {
    beforeEach(async function () {
      this.contract = this.crowdsale;
      await this.contract.addCapper(otherCapper, { from: capper });
    });

    shouldBehaveLikePublicRole(capper, otherCapper, otherAccounts, 'capper');
  });

  describe('individual caps', function () {
    it('sets a cap when the sender is a capper', async function () {
      await this.crowdsale.setCap(alice, capAlice, { from: capper });
      (await this.crowdsale.getCap(alice)).should.be.bignumber.equal(capAlice);
    });

    it('reverts when a non-capper sets a cap', async function () {
      await expectThrow(this.crowdsale.setCap(alice, capAlice, { from: anyone }), EVMRevert);
    });

    context('with individual caps', function () {
      beforeEach(async function () {
        await this.crowdsale.setCap(alice, capAlice, { from: capper });
        await this.crowdsale.setCap(bob, capBob, { from: capper });
        await this.token.transfer(this.crowdsale.address, tokenSupply);
      });

      describe('accepting payments', function () {
        it('should accept payments within cap', async function () {
          await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice });
          await this.crowdsale.buyTokens(bob, { value: lessThanCapBoth });
        });

        it('should reject payments outside cap', async function () {
          await this.crowdsale.buyTokens(alice, { value: capAlice });
          await expectThrow(this.crowdsale.buyTokens(alice, { value: 1 }), EVMRevert);
        });

        it('should reject payments that exceed cap', async function () {
          await expectThrow(this.crowdsale.buyTokens(alice, { value: capAlice.plus(1) }), EVMRevert);
          await expectThrow(this.crowdsale.buyTokens(bob, { value: capBob.plus(1) }), EVMRevert);
        });

        it('should manage independent caps', async function () {
          await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice });
          await expectThrow(this.crowdsale.buyTokens(bob, { value: lessThanCapAlice }), EVMRevert);
        });

        it('should default to a cap of zero', async function () {
          await expectThrow(this.crowdsale.buyTokens(charlie, { value: lessThanCapBoth }), EVMRevert);
        });
      });

      describe('reporting state', function () {
        it('should report correct cap', async function () {
          (await this.crowdsale.getCap(alice)).should.be.bignumber.equal(capAlice);
        });

        it('should report actual contribution', async function () {
          await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice });
          (await this.crowdsale.getContribution(alice)).should.be.bignumber.equal(lessThanCapAlice);
        });
      });
    });
  });
});
