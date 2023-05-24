const { constants, expectEvent } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../helpers/customError');

const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Ownable = artifacts.require('$Ownable');

contract('Ownable', function (accounts) {
  const [owner, other] = accounts;

  beforeEach(async function () {
    this.ownable = await Ownable.new(owner);
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
      await expectRevertCustomError(
        this.ownable.transferOwnership(other, { from: other }),
        'OwnableUnauthorizedAccount',
        [other],
      );
    });

    it('guards ownership against stuck state', async function () {
      await expectRevertCustomError(
        this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'OwnableInvalidOwner',
        [ZERO_ADDRESS],
      );
    });
  });

  describe('renounce ownership', function () {
    it('loses ownership after renouncement', async function () {
      const receipt = await this.ownable.renounceOwnership({ from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(ZERO_ADDRESS);
    });

    it('prevents non-owners from renouncement', async function () {
      await expectRevertCustomError(this.ownable.renounceOwnership({ from: other }), 'OwnableUnauthorizedAccount', [
        other,
      ]);
    });

    it('allows to recover access using the internal _transferOwnership', async function () {
      await this.ownable.renounceOwnership({ from: owner });
      const receipt = await this.ownable.$_transferOwnership(other);
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(other);
    });
  });
});
