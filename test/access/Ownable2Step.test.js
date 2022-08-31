const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
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
      expectEvent(receipt, 'OwnershipTransferStarted', { previousOwner: owner, newOwner: accountA });
      expect(await this.ownable2Step.owner()).to.equal(owner);
      expect(await this.ownable2Step.pendingOwner()).to.equal(accountA);
    });

    it('changes owner after transfer', async function () {
      await this.ownable2Step.transferOwnership(accountA, { from: owner });
      const receipt = await this.ownable2Step.acceptOwnership({ from: accountA });
      expectEvent(receipt, 'OwnershipTransferred', { previousOwner: owner, newOwner: accountA });
      expect(await this.ownable2Step.owner()).to.equal(accountA);
      expect(await this.ownable2Step.pendingOwner()).to.not.equal(accountA);
    });

    it('changes owner after renouncing ownership', async function () {
      await this.ownable2Step.renounceOwnership({ from: owner });
      // If renounceOwnership is removed from parent an alternative is needed ...
      // without it is difficult to cleanly renounce with the two step process
      // see: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3620#discussion_r957930388
      expect(await this.ownable2Step.owner()).to.equal(ZERO_ADDRESS);
    });

    it('pending owner resets after renouncing ownership', async function () {
      await this.ownable2Step.transferOwnership(accountA, { from: owner });
      expect(await this.ownable2Step.pendingOwner()).to.equal(accountA);
      await this.ownable2Step.renounceOwnership({ from: owner });
      expect(await this.ownable2Step.pendingOwner()).to.equal(ZERO_ADDRESS);
      await expectRevert(
        this.ownable2Step.acceptOwnership({ from: accountA }),
        'Ownable2Step: caller is not the new owner',
      );
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
