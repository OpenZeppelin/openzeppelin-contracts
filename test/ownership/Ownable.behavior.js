const shouldFail = require('../helpers/shouldFail');
const expectEvent = require('../helpers/expectEvent');
const { ZERO_ADDRESS } = require('../helpers/constants');
require('./../helpers/setup');

function shouldBehaveLikeOwnable (owner, [anyone]) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      (await this.ownable.owner()).should.equal(owner);
    });

    it('changes owner after transfer', async function () {
      (await this.ownable.isOwner({ from: anyone })).should.be.equal(false);
      const { logs } = await this.ownable.transferOwnership(anyone, { from: owner });
      expectEvent.inLogs(logs, 'OwnershipTransferred');

      (await this.ownable.owner()).should.equal(anyone);
      (await this.ownable.isOwner({ from: anyone })).should.be.equal(true);
    });

    it('should prevent non-owners from transfering', async function () {
      await shouldFail.reverting(this.ownable.transferOwnership(anyone, { from: anyone }));
    });

    it('should guard ownership against stuck state', async function () {
      await shouldFail.reverting(this.ownable.transferOwnership(null, { from: owner }));
    });

    it('loses owner after renouncement', async function () {
      const { logs } = await this.ownable.renounceOwnership({ from: owner });
      expectEvent.inLogs(logs, 'OwnershipTransferred');

      (await this.ownable.owner()).should.equal(ZERO_ADDRESS);
    });

    it('should prevent non-owners from renouncement', async function () {
      await shouldFail.reverting(this.ownable.renounceOwnership({ from: anyone }));
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
