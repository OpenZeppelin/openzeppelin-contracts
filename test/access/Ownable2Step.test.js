const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const Ownable2Step = artifacts.require('Ownable2StepMock');

contract('Ownable2Step', function (accounts) {
  const [owner, accountA, accountB] = accounts;

  beforeEach(async function () {
    this.ownable2Step = await Ownable2Step.new({ from: owner });
  });

  describe('transfer ownership', function () {
    it('starting a transfer does not change owner', async function () {
      const receipt = await this.ownable2Step.transferOwnership(accountA, { from: owner });
      expectEvent(receipt, 'OwnershipTransferStarted');
      expect(await this.ownable2Step.owner()).to.equal(owner);
      expect(await this.ownable2Step.pendingOwner()).to.equal(accountA);
    });

    it('changes owner after transfer', async function () {
      await this.ownable2Step.transferOwnership(accountA, { from: owner });
      const receipt = await this.ownable2Step.acceptOwnership({ from: accountA });
      expectEvent(receipt, 'OwnershipTransferred');
      expect(await this.ownable2Step.owner()).to.equal(accountA);
      expect(await this.ownable2Step.pendingOwner()).to.not.equal(accountA);
    });

    it('changes owner after force transfer', async function () {
      await this.ownable2Step.forceTransferOwnership(accountA, { from: owner });
      expect(await this.ownable2Step.owner()).to.equal(accountA);
      expect(await this.ownable2Step.pendingOwner()).to.not.equal(accountA);
    });

    it('guards transfer against invalid user', async function () {
      await this.ownable2Step.transferOwnership(accountA, { from: owner });
      await expectRevert(
        this.ownable2Step.acceptOwnership({ from: accountB }),
        'Ownable2Step: caller is not the new owner',
      );
    });
  });
});
