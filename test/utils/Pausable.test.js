const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [pauser] = await ethers.getSigners();

  const mock = await ethers.deployContract('PausableMock');

  return { pauser, mock };
}

describe('Pausable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('when unpaused', function () {
    beforeEach(async function () {
      expect(await this.mock.paused()).to.be.false;
    });

    it('can perform normal process in non-pause', async function () {
      expect(await this.mock.count()).to.equal(0n);

      await this.mock.normalProcess();
      expect(await this.mock.count()).to.equal(1n);
    });

    it('cannot take drastic measure in non-pause', async function () {
      await expect(this.mock.drasticMeasure()).to.be.revertedWithCustomError(this.mock, 'ExpectedPause');

      expect(await this.mock.drasticMeasureTaken()).to.be.false;
    });

    describe('when paused', function () {
      beforeEach(async function () {
        this.tx = await this.mock.pause();
      });

      it('emits a Paused event', async function () {
        await expect(this.tx).to.emit(this.mock, 'Paused').withArgs(this.pauser.address);
      });

      it('cannot perform normal process in pause', async function () {
        await expect(this.mock.normalProcess()).to.be.revertedWithCustomError(this.mock, 'EnforcedPause');
      });

      it('can take a drastic measure in a pause', async function () {
        await this.mock.drasticMeasure();
        expect(await this.mock.drasticMeasureTaken()).to.be.true;
      });

      it('reverts when re-pausing', async function () {
        await expect(this.mock.pause()).to.be.revertedWithCustomError(this.mock, 'EnforcedPause');
      });

      describe('unpausing', function () {
        it('is unpausable by the pauser', async function () {
          await this.mock.unpause();
          expect(await this.mock.paused()).to.be.false;
        });

        describe('when unpaused', function () {
          beforeEach(async function () {
            this.tx = await this.mock.unpause();
          });

          it('emits an Unpaused event', async function () {
            await expect(this.tx).to.emit(this.mock, 'Unpaused').withArgs(this.pauser.address);
          });

          it('should resume allowing normal process', async function () {
            expect(await this.mock.count()).to.equal(0n);
            await this.mock.normalProcess();
            expect(await this.mock.count()).to.equal(1n);
          });

          it('should prevent drastic measure', async function () {
            await expect(this.mock.drasticMeasure()).to.be.revertedWithCustomError(this.mock, 'ExpectedPause');
          });

          it('reverts when re-unpausing', async function () {
            await expect(this.mock.unpause()).to.be.revertedWithCustomError(this.mock, 'ExpectedPause');
          });
        });
      });
    });
  });
});
