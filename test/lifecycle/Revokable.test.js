const { accounts, contract } = require('@openzeppelin/test-environment');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { shouldBehaveLikePublicRole } = require('../behaviors/access/roles/PublicRole.behavior');

const { expect } = require('chai');

const RevokableMock = contract.fromArtifact('RevokableMock');

describe('Revokable', function () {
  const [ revoker, otherRevoker, other, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.revokable = await RevokableMock.new({ from: revoker });
  });

  describe('revoker role', function () {
    beforeEach(async function () {
      this.contract = this.revokable;
      await this.contract.addRevoker(otherRevoker, { from: revoker });
    });

    shouldBehaveLikePublicRole(revoker, otherRevoker, otherAccounts, 'revoker');
  });

  context('when not revoked', function () {
    beforeEach(async function () {
      expect(await this.revokable.revoked()).to.equal(false);
    });

    it('can perform normal process in non-revoked', async function () {
      expect(await this.revokable.count()).to.be.bignumber.equal('0');

      await this.revokable.normalProcess({ from: other });
      expect(await this.revokable.count()).to.be.bignumber.equal('1');
    });

    describe('revoking', function () {
      it('is revokable by the revoker', async function () {
        await this.revokable.revoke({ from: revoker });
        expect(await this.revokable.revoked()).to.equal(true);
      });

      it('reverts when revoking from non-revoker', async function () {
        await expectRevert(this.revokable.revoke({ from: other }),
          'RevokerRole: caller does not have the Revoker role'
        );
      });

      context('when revoked', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.revokable.revoke({ from: revoker }));
        });

        it('emits a Revoked event', function () {
          expectEvent.inLogs(this.logs, 'Revoked', { account: revoker });
        });

        it('cannot perform normal process while revoked', async function () {
          await expectRevert(this.revokable.normalProcess({ from: other }), 'Revokable: revoked');
        });

        it('can take a drastic measure while revoked', async function () {
          await this.revokable.drasticMeasure({ from: other });
          expect(await this.revokable.drasticMeasureTaken()).to.equal(true);
        });

        it('reverts when re-revoking', async function () {
          await expectRevert(this.revokable.revoke({ from: revoker }), 'Revokable: revoked');
        });
      });
    });
  });
});
