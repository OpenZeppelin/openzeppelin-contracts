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

  it('should have an owner', async function () {
    expect(await this.ownable.owner()).to.equal(owner);
  });

  it('changes owner after transfer', async function () {
    const receipt = await this.ownable.transferOwnership(other, { from: owner });
    expectEvent(receipt, 'OwnershipTransferred');

    expect(await this.ownable.owner()).to.equal(other);
  });

  it('should prevent non-owners from transferring', async function () {
    await expectRevert(
      this.ownable.transferOwnership(other, { from: other }),
      'Ownable: caller is not the owner'
    );
  });

  it('should guard ownership against stuck state', async function () {
    await expectRevert(
      this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
      'Ownable: new owner is the zero address'
    );
  });

  it('loses owner after renouncement', async function () {
    const receipt = await this.ownable.renounceOwnership({ from: owner });
    expectEvent(receipt, 'OwnershipTransferred');

    expect(await this.ownable.owner()).to.equal(ZERO_ADDRESS);
  });

  it('should prevent non-owners from renouncement', async function () {
    await expectRevert(
      this.ownable.renounceOwnership({ from: other }),
      'Ownable: caller is not the owner'
    );
  });
});
