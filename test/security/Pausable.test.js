const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const PausableMock = artifacts.require('PausableMock');

contract('Pausable', function (accounts) {
  const [ pauser ] = accounts;

  beforeEach(async function () {
    this.pausable = await PausableMock.new();
  });

  context('when unpaused', function () {
    beforeEach(async function () {
      expect(await this.pausable.paused()).to.equal(false);
    });

    it('can perform normal process in non-pause', async function () {
      expect(await this.pausable.count()).to.be.bignumber.equal('0');

      await this.pausable.normalProcess();
      expect(await this.pausable.count()).to.be.bignumber.equal('1');
    });

    it('cannot take drastic measure in non-pause', async function () {
      await expectRevert(this.pausable.drasticMeasure(),
        'Pausable: not paused',
      );
      expect(await this.pausable.drasticMeasureTaken()).to.equal(false);
    });

    context('when paused', function () {
      beforeEach(async function () {
        (this.receipt = await this.pausable.pause({ from: pauser }));
      });

      it('emits a Paused event', function () {
        expectEvent(this.receipt, 'Paused', { account: pauser });
      });

      it('cannot perform normal process in pause', async function () {
        await expectRevert(this.pausable.normalProcess(), 'Pausable: paused');
      });

      it('can take a drastic measure in a pause', async function () {
        await this.pausable.drasticMeasure();
        expect(await this.pausable.drasticMeasureTaken()).to.equal(true);
      });

      it('reverts when re-pausing', async function () {
        await expectRevert(this.pausable.pause(), 'Pausable: paused');
      });

      describe('unpausing', function () {
        it('is unpausable by the pauser', async function () {
          await this.pausable.unpause();
          expect(await this.pausable.paused()).to.equal(false);
        });

        context('when unpaused', function () {
          beforeEach(async function () {
            (this.receipt = await this.pausable.unpause({ from: pauser }));
          });

          it('emits an Unpaused event', function () {
            expectEvent(this.receipt, 'Unpaused', { account: pauser });
          });

          it('should resume allowing normal process', async function () {
            expect(await this.pausable.count()).to.be.bignumber.equal('0');
            await this.pausable.normalProcess();
            expect(await this.pausable.count()).to.be.bignumber.equal('1');
          });

          it('should prevent drastic measure', async function () {
            await expectRevert(this.pausable.drasticMeasure(),
              'Pausable: not paused',
            );
          });

          it('reverts when re-unpausing', async function () {
            await expectRevert(this.pausable.unpause(), 'Pausable: not paused');
          });
        });
      });
    });
  });
});
