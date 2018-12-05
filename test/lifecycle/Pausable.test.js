const shouldFail = require('../helpers/shouldFail');
const expectEvent = require('../helpers/expectEvent');

const PausableMock = artifacts.require('PausableMock');
const { shouldBehaveLikePublicRole } = require('../access/roles/PublicRole.behavior');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Pausable', function ([_, pauser, otherPauser, anyone, ...otherAccounts]) {
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

  context('when unapused', function () {
    beforeEach(async function () {
      (await this.pausable.paused()).should.equal(false);
    });

    it('can perform normal process in non-pause', async function () {
      (await this.pausable.count()).should.be.bignumber.equal(0);

      await this.pausable.normalProcess({ from: anyone });
      (await this.pausable.count()).should.be.bignumber.equal(1);
    });

    it('cannot take drastic measure in non-pause', async function () {
      await shouldFail.reverting(this.pausable.drasticMeasure({ from: anyone }));
      (await this.pausable.drasticMeasureTaken()).should.equal(false);
    });

    describe('pausing', function () {
      it('is pausable by the pauser', async function () {
        await this.pausable.pause({ from: pauser });
        (await this.pausable.paused()).should.equal(true);
      });

      it('reverts when pausing from non-pauser', async function () {
        await shouldFail.reverting(this.pausable.pause({ from: anyone }));
      });

      context('when paused', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.pausable.pause({ from: pauser }));
        });

        it('emits a Paused event', function () {
          expectEvent.inLogs(this.logs, 'Paused', { account: pauser });
        });

        it('cannot perform normal process in pause', async function () {
          await shouldFail.reverting(this.pausable.normalProcess({ from: anyone }));
        });

        it('can take a drastic measure in a pause', async function () {
          await this.pausable.drasticMeasure({ from: anyone });
          (await this.pausable.drasticMeasureTaken()).should.equal(true);
        });

        it('reverts when re-pausing', async function () {
          await shouldFail.reverting(this.pausable.pause({ from: pauser }));
        });

        describe('unpausing', function () {
          it('is unpausable by the pauser', async function () {
            await this.pausable.unpause({ from: pauser });
            (await this.pausable.paused()).should.equal(false);
          });

          it('reverts when unpausing from non-pauser', async function () {
            await shouldFail.reverting(this.pausable.unpause({ from: anyone }));
          });

          context('when unpaused', function () {
            beforeEach(async function () {
              ({ logs: this.logs } = await this.pausable.unpause({ from: pauser }));
            });

            it('emits an Unpaused event', function () {
              expectEvent.inLogs(this.logs, 'Unpaused', { account: pauser });
            });

            it('should resume allowing normal process', async function () {
              (await this.pausable.count()).should.be.bignumber.equal(0);
              await this.pausable.normalProcess({ from: anyone });
              (await this.pausable.count()).should.be.bignumber.equal(1);
            });

            it('should prevent drastic measure', async function () {
              await shouldFail.reverting(this.pausable.drasticMeasure({ from: anyone }));
            });

            it('reverts when re-unpausing', async function () {
              await shouldFail.reverting(this.pausable.unpause({ from: pauser }));
            });
          });
        });
      });
    });
  });
});
