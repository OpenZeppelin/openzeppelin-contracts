const { constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeOwnable (owner, [other]) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      expect(await this.ownable.owner()).to.equal(owner);
    });

    it('changes owner after transfer', async function () {
      expect(await this.ownable.isOwner({ from: other })).to.be.equal(false);
      const { logs } = await this.ownable.transferOwnership(other, { from: owner });
      expectEvent.inLogs(logs, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(other);
      expect(await this.ownable.isOwner({ from: other })).to.be.equal(true);
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
      const { logs } = await this.ownable.renounceOwnership({ from: owner });
      expectEvent.inLogs(logs, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(ZERO_ADDRESS);
    });

    it('should prevent non-owners from renouncement', async function () {
      await expectRevert(
        this.ownable.renounceOwnership({ from: other }),
        'Ownable: caller is not the owner'
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
