const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { expectRevertCustomError } = require('../helpers/customError');

const PausableMock = 'PausableMock';

async function fixture() {
  const [pauser] = await ethers.getSigners();

  const pausable = await ethers.deployContract(PausableMock);

  return { pauser, pausable };
}

describe('Pausable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('when unpaused', function () {
    beforeEach(async function () {
      expect(await this.pausable.paused()).to.equal(false);
    });

    it('can perform normal process in non-pause', async function () {
      expect(await this.pausable.count()).to.be.equal('0');

      await this.pausable.normalProcess();
      expect(await this.pausable.count()).to.be.equal('1');
    });

    it('cannot take drastic measure in non-pause', async function () {
      await expectRevertCustomError(this.pausable.drasticMeasure(), 'ExpectedPause', []);
      expect(await this.pausable.drasticMeasureTaken()).to.equal(false);
    });

    describe('when paused', function () {
      beforeEach(async function () {
        this.tx = await this.pausable.pause();
      });

      it('emits a Paused event', async function () {
        await expect(this.tx).to.emit(this.pausable, 'Paused').withArgs(this.pauser.address);
      });

      it('cannot perform normal process in pause', async function () {
        await expect(this.pausable.normalProcess()).to.be.revertedWithCustomError(this.pausable, 'EnforcedPause');
      });

      it('can take a drastic measure in a pause', async function () {
        await this.pausable.drasticMeasure();
        expect(await this.pausable.drasticMeasureTaken()).to.equal(true);
      });

      it('reverts when re-pausing', async function () {
        await expectRevertCustomError(this.pausable.pause(), 'EnforcedPause', []);
      });

      describe('unpausing', function () {
        it('is unpausable by the pauser', async function () {
          await this.pausable.unpause();
          expect(await this.pausable.paused()).to.equal(false);
        });

        describe('when unpaused', function () {
          beforeEach(async function () {
            this.tx = await this.pausable.unpause();
          });

          it('emits an Unpaused event', async function () {
            await expect(this.tx).to.emit(this.pausable, 'Unpaused').withArgs(this.pauser.address);
          });

          it('should resume allowing normal process', async function () {
            expect(await this.pausable.count()).to.be.equal('0');
            await this.pausable.normalProcess();
            expect(await this.pausable.count()).to.be.equal('1');
          });

          it('should prevent drastic measure', async function () {
            await expect(this.pausable.drasticMeasure()).to.be.revertedWithCustomError(this.pausable, 'ExpectedPause');
          });

          it('reverts when re-unpausing', async function () {
            await expect(this.pausable.unpause()).to.be.revertedWithCustomError(this.pausable, 'ExpectedPause');
          });
        });
      });
    });
  });
});
