const { accounts, contract } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Ownable = contract.fromArtifact('OwnableMock');

describe('Ownable', function () {
  const [ owner, other ] = accounts;

  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner });
  });

  it('has an owner', async function () {
    expect(await this.ownable.owner()).to.equal(owner);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      const receipt = await this.ownable.transferOwnership(other, { from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(other);
    });

    it('prevents non-owners from transferring', async function () {
      await expectRevert(
        this.ownable.transferOwnership(other, { from: other }),
        'Ownable: caller is not the owner',
      );
    });

    it('guards ownership against stuck state', async function () {
      await expectRevert(
        this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'Ownable: new owner is the zero address',
      );
    });
  });

  describe('renounce ownership', function () {
    it('loses owner after renouncement', async function () {
      const receipt = await this.ownable.renounceOwnership({ from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(ZERO_ADDRESS);
    });

    it('prevents non-owners from renouncement', async function () {
      await expectRevert(
        this.ownable.renounceOwnership({ from: other }),
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('grant and claim ownership', function () {
    it('grants ownership', async function () {
      const receipt = await this.ownable.grantOwnership(other, { from: owner });
      expectEvent(receipt, 'OwnershipGranted');

      expect(await this.ownable.grantedOwner()).to.equal(other);
    });

    it('prevents non-owners from granting', async function () {
      await expectRevert(
        this.ownable.grantOwnership(other, { from: other }),
        'Ownable: caller is not the owner',
      );
    });

    it('prevents non-granted-owners from claiming ownership', async function () {
      await expectRevert(
        this.ownable.claimOwnership({ from: owner }),
        'Ownable: caller is not the granted owner',
      );
    });

    it('grants ownership and claims it', async function () {
      let receipt = await this.ownable.grantOwnership(other, { from: owner });
      expectEvent(receipt, 'OwnershipGranted');

      expect(await this.ownable.grantedOwner()).to.equal(other);

      receipt = await this.ownable.claimOwnership({ from: other });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(other);
      expect(await this.ownable.grantedOwner()).to.equal(ZERO_ADDRESS);
    });
  });
});
