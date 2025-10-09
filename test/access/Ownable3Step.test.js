const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [owner, accountA, accountB] = await ethers.getSigners();
  const Ownable3Step = await ethers.getContractFactory('Ownable3StepMock'); // نستخدم Mock لتجربة
  const ownable3Step = await Ownable3Step.deploy();
  await ownable3Step.deployed();

  return {
    ownable3Step,
    owner,
    accountA,
    accountB,
  };
}

describe('Ownable3Step', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('ownership transfer (3-step)', function () {
    it('proposing a new owner does not change owner', async function () {
      await expect(this.ownable3Step.connect(this.owner).proposeOwner(this.accountA.address))
        .to.emit(this.ownable3Step, 'OwnershipTransferStarted')
        .withArgs(this.owner.address, this.accountA.address);

      expect(await this.ownable3Step.owner()).to.equal(this.owner.address);
      expect(await this.ownable3Step.pendingOwner()).to.equal(this.accountA.address);
      expect(await this.ownable3Step.pendingOwnerAccepted()).to.equal(false);
    });

    it('cannot finalize before proposed owner accepts', async function () {
      await this.ownable3Step.connect(this.owner).proposeOwner(this.accountA.address);

      await expect(this.ownable3Step.connect(this.owner).finalizeOwnership())
        .to.be.revertedWith('Ownable3Step: proposed owner must accept first');
    });

    it('only pending owner can accept', async function () {
      await this.ownable3Step.connect(this.owner).proposeOwner(this.accountA.address);

      await expect(this.ownable3Step.connect(this.accountB).acceptProposedOwnership())
        .to.be.revertedWithCustomError(this.ownable3Step, 'OwnableUnauthorizedAccount')
        .withArgs(this.accountB.address);
    });

    it('accepting and finalizing changes ownership', async function () {
      // Step 1: propose
      await this.ownable3Step.connect(this.owner).proposeOwner(this.accountA.address);

      // Step 2: accept
      await expect(this.ownable3Step.connect(this.accountA).acceptProposedOwnership())
        .to.emit(this.ownable3Step, 'OwnershipAccepted')
        .withArgs(this.accountA.address);

      // Step 3: finalize
      await expect(this.ownable3Step.connect(this.owner).finalizeOwnership())
        .to.emit(this.ownable3Step, 'OwnershipFinalized')
        .withArgs(this.owner.address, this.accountA.address);

      expect(await this.ownable3Step.owner()).to.equal(this.accountA.address);
      expect(await this.ownable3Step.pendingOwner()).to.equal(ethers.ZeroAddress);
      expect(await this.ownable3Step.pendingOwnerAccepted()).to.equal(false);
    });

    it('owner can cancel proposed ownership by setting zero address', async function () {
      await this.ownable3Step.connect(this.owner).proposeOwner(this.accountA.address);
      expect(await this.ownable3Step.pendingOwner()).to.equal(this.accountA.address);

      await expect(this.ownable3Step.connect(this.owner).proposeOwner(ethers.ZeroAddress))
        .to.emit(this.ownable3Step, 'OwnershipTransferStarted')
        .withArgs(this.owner.address, ethers.ZeroAddress);

      expect(await this.ownable3Step.pendingOwner()).to.equal(ethers.ZeroAddress);

      await expect(this.ownable3Step.connect(this.accountA).acceptProposedOwnership())
        .to.be.revertedWithCustomError(this.ownable3Step, 'OwnableUnauthorizedAccount')
        .withArgs(this.accountA.address);
    });
  });
});
