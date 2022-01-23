const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const IndividuallyCappedCrowdsaleImpl = contract.fromArtifact('IndividuallyCappedCrowdsaleImpl');
const SimpleToken = contract.fromArtifact('SimpleToken');
const { shouldBehaveLikePublicRole } = require('../behaviors/access/roles/PublicRole.behavior');

describe('IndividuallyCappedCrowdsale', function () {
  const [ capper, otherCapper, wallet, alice, bob, charlie, other, ...otherAccounts ] = accounts;

  const rate = new BN(1);
  const capAlice = ether('10');
  const capBob = ether('2');
  const lessThanCapAlice = ether('6');
  const lessThanCapBoth = ether('1');
  const tokenSupply = new BN('10').pow(new BN('22'));

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
      expect(await this.crowdsale.getCap(alice)).to.be.bignumber.equal(capAlice);
    });

    it('reverts when a non-capper sets a cap', async function () {
      await expectRevert(this.crowdsale.setCap(alice, capAlice, { from: other }),
        'CapperRole: caller does not have the Capper role'
      );
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
          await expectRevert(this.crowdsale.buyTokens(alice, { value: 1 }),
            'IndividuallyCappedCrowdsale: beneficiary\'s cap exceeded'
          );
        });

        it('should reject payments that exceed cap', async function () {
          await expectRevert(this.crowdsale.buyTokens(alice, { value: capAlice.addn(1) }),
            'IndividuallyCappedCrowdsale: beneficiary\'s cap exceeded'
          );
          await expectRevert(this.crowdsale.buyTokens(bob, { value: capBob.addn(1) }),
            'IndividuallyCappedCrowdsale: beneficiary\'s cap exceeded'
          );
        });

        it('should manage independent caps', async function () {
          await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice });
          await expectRevert(this.crowdsale.buyTokens(bob, { value: lessThanCapAlice }),
            'IndividuallyCappedCrowdsale: beneficiary\'s cap exceeded'
          );
        });

        it('should default to a cap of zero', async function () {
          await expectRevert(this.crowdsale.buyTokens(charlie, { value: lessThanCapBoth }),
            'IndividuallyCappedCrowdsale: beneficiary\'s cap exceeded'
          );
        });
      });

      describe('reporting state', function () {
        it('should report correct cap', async function () {
          expect(await this.crowdsale.getCap(alice)).to.be.bignumber.equal(capAlice);
        });

        it('should report actual contribution', async function () {
          await this.crowdsale.buyTokens(alice, { value: lessThanCapAlice });
          expect(await this.crowdsale.getContribution(alice)).to.be.bignumber.equal(lessThanCapAlice);
        });
      });
    });
  });
});
