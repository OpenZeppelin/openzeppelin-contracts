const { constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeOwnable (owner, [other]) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      (await this.ownable.owner()).should.equal(owner);
    });

    it('changes owner after transfer', async function () {
      (await this.ownable.isOwner({ from: other })).should.be.equal(false);
      const { logs } = await this.ownable.transferOwnership(other, { from: owner });
      expectEvent.inLogs(logs, 'OwnershipTransferred');

      (await this.ownable.owner()).should.equal(other);
      (await this.ownable.isOwner({ from: other })).should.be.equal(true);
    });

    it('should prevent non-owners from transferring', async function () {
      await shouldFail.reverting.withMessage(
        this.ownable.transferOwnership(other, { from: other }),
        'Ownable: caller is not the owner'
      );
    });

    it('should guard ownership against stuck state', async function () {
      await shouldFail.reverting.withMessage(
        this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'Ownable: new owner is the zero address'
      );
    });

    it('loses owner after renouncement', async function () {
      const { logs } = await this.ownable.renounceOwnership({ from: owner });
      expectEvent.inLogs(logs, 'OwnershipTransferred');

      (await this.ownable.owner()).should.equal(ZERO_ADDRESS);
    });

    it('should prevent non-owners from renouncement', async function () {
      await shouldFail.reverting.withMessage(
        this.ownable.renounceOwnership({ from: other }),
        'Ownable: caller is not the owner'
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
