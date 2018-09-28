const shouldFail = require('../helpers/shouldFail');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .should();

function shouldBehaveLikeOwnable (owner, [anyone]) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      (await this.ownable.owner()).should.equal(owner);
    });

    it('changes owner after transfer', async function () {
      (await this.ownable.isOwner({ from: anyone })).should.be.equal(false);
      await this.ownable.transferOwnership(anyone, { from: owner });

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
      await this.ownable.renounceOwnership({ from: owner });
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
