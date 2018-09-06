const { assertRevert } = require('../helpers/assertRevert');
const expectEvent = require('../helpers/expectEvent');
const PausableMock = artifacts.require('PausableMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Pausable', function ([_, pauser, anyone]) {
  beforeEach(async function () {
    this.Pausable = await PausableMock.new({ from: pauser });
  });

  context('when unapused', function () {
    beforeEach(async function () {
      (await this.Pausable.paused()).should.equal(false);
    });

    it('can perform normal process in non-pause', async function () {
      (await this.Pausable.count()).should.be.bignumber.equal(0);

      await this.Pausable.normalProcess({ from: anyone });
      (await this.Pausable.count()).should.be.bignumber.equal(1);
    });

    it('cannot take drastic measure in non-pause', async function () {
      await assertRevert(this.Pausable.drasticMeasure({ from: anyone }));
      (await this.Pausable.drasticMeasureTaken()).should.equal(false);
    });

    describe('pausing', function () {
      it('is pausable by the pauser', async function () {
        await this.Pausable.pause({ from: pauser });
        (await this.Pausable.paused()).should.equal(true);
      });

      it('reverts when pausing from non-pauser', async function () {
        await assertRevert(this.Pausable.pause({ from: anyone }));
      });

      context('when paused', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.Pausable.pause({ from: pauser }));
        });

        it('emits a Paused event', function () {
          expectEvent.inLogs(this.logs, 'Paused');
        });

        it('cannot perform normal process in pause', async function () {
          await assertRevert(this.Pausable.normalProcess({ from: anyone }));
        });

        it('can take a drastic measure in a pause', async function () {
          await this.Pausable.drasticMeasure({ from: anyone });
          (await this.Pausable.drasticMeasureTaken()).should.equal(true);
        });

        it('reverts when re-pausing', async function () {
          await assertRevert(this.Pausable.pause({ from: pauser }));
        });

        describe('unpausing', function () {
          it('is unpausable by the pauser', async function () {
            await this.Pausable.unpause({ from: pauser });
            (await this.Pausable.paused()).should.equal(false);
          });

          it('reverts when unpausing from non-pauser', async function () {
            await assertRevert(this.Pausable.unpause({ from: anyone }));
          });

          context('when unpaused', function () {
            beforeEach(async function () {
              ({ logs: this.logs } = await this.Pausable.unpause({ from: pauser }));
            });

            it('emits an Unpaused event', function () {
              expectEvent.inLogs(this.logs, 'Unpaused');
            });

            it('should resume allowing normal process', async function () {
              (await this.Pausable.count()).should.be.bignumber.equal(0);
              await this.Pausable.normalProcess({ from: anyone });
              (await this.Pausable.count()).should.be.bignumber.equal(1);
            });

            it('should prevent drastic measure', async function () {
              await assertRevert(this.Pausable.drasticMeasure({ from: anyone }));
            });

            it('reverts when re-unpausing', async function () {
              await assertRevert(this.Pausable.unpause({ from: pauser }));
            });
          });
        });
      });
    });
  });
});
