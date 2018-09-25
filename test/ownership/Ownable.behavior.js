const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

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
      await expectThrow(this.ownable.transferOwnership(anyone, { from: anyone }), EVMRevert);
    });

    it('should guard ownership against stuck state', async function () {
      await expectThrow(this.ownable.transferOwnership(null, { from: owner }), EVMRevert);
    });

    it('loses owner after renouncement', async function () {
      await this.ownable.renounceOwnership({ from: owner });
      (await this.ownable.owner()).should.equal(ZERO_ADDRESS);
    });

    it('should prevent non-owners from renouncement', async function () {
      await expectThrow(this.ownable.renounceOwnership({ from: anyone }), EVMRevert);
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
