const { accounts, contract } = require('@openzeppelin/test-environment');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { shouldBehaveLikePublicRole } = require('../behaviors/access/roles/PublicRole.behavior');

const { expect } = require('chai');

const PausableMock = contract.fromArtifact('PausableMock');

describe('Pausable', function () {
  const [ pauser, otherPauser, other, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.pausable = await PausableMock.new({ from: pauser });
  });

  describe('pauser role', function () {
    beforeEach(async function () {
      this.contract = this.pausable;
      await this.contract.addPauser(otherPauser, { from: pauser });
    });

    shouldBehaveLikePublicRole(pauser, otherPauser, otherAccounts, 'pauser');
  });

  context('when unpaused', function () {
    beforeEach(async function () {
      expect(await this.pausable.paused()).to.equal(false);
    });

    it('can perform normal process in non-pause', async function () {
      expect(await this.pausable.count()).to.be.bignumber.equal('0');

      await this.pausable.normalProcess({ from: other });
      expect(await this.pausable.count()).to.be.bignumber.equal('1');
    });

    it('cannot take drastic measure in non-pause', async function () {
      await expectRevert(this.pausable.drasticMeasure({ from: other }),
        'Pausable: not paused'
      );
      expect(await this.pausable.drasticMeasureTaken()).to.equal(false);
    });

    describe('pausing', function () {
      it('is pausable by the pauser', async function () {
        await this.pausable.pause({ from: pauser });
        expect(await this.pausable.paused()).to.equal(true);
      });

      it('reverts when pausing from non-pauser', async function () {
        await expectRevert(this.pausable.pause({ from: other }),
          'PauserRole: caller does not have the Pauser role'
        );
      });

      context('when paused', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.pausable.pause({ from: pauser }));
        });

        it('emits a Paused event', function () {
          expectEvent.inLogs(this.logs, 'Paused', { account: pauser });
        });

        it('cannot perform normal process in pause', async function () {
          await expectRevert(this.pausable.normalProcess({ from: other }), 'Pausable: paused');
        });

        it('can take a drastic measure in a pause', async function () {
          await this.pausable.drasticMeasure({ from: other });
          expect(await this.pausable.drasticMeasureTaken()).to.equal(true);
        });

        it('reverts when re-pausing', async function () {
          await expectRevert(this.pausable.pause({ from: pauser }), 'Pausable: paused');
        });

        describe('unpausing', function () {
          it('is unpausable by the pauser', async function () {
            await this.pausable.unpause({ from: pauser });
            expect(await this.pausable.paused()).to.equal(false);
          });

          it('reverts when unpausing from non-pauser', async function () {
            await expectRevert(this.pausable.unpause({ from: other }),
              'PauserRole: caller does not have the Pauser role'
            );
          });

          context('when unpaused', function () {
            beforeEach(async function () {
              ({ logs: this.logs } = await this.pausable.unpause({ from: pauser }));
            });

            it('emits an Unpaused event', function () {
              expectEvent.inLogs(this.logs, 'Unpaused', { account: pauser });
            });

            it('should resume allowing normal process', async function () {
              expect(await this.pausable.count()).to.be.bignumber.equal('0');
              await this.pausable.normalProcess({ from: other });
              expect(await this.pausable.count()).to.be.bignumber.equal('1');
            });

            it('should prevent drastic measure', async function () {
              await expectRevert(this.pausable.drasticMeasure({ from: other }),
                'Pausable: not paused'
              );
            });

            it('reverts when re-unpausing', async function () {
              await expectRevert(this.pausable.unpause({ from: pauser }), 'Pausable: not paused');
            });
          });
        });
      });
    });
  });
});
