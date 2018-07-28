const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

require('chai')
  .should();

function shouldBehaveLikeOwnable (accounts) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      const owner = await this.ownable.owner();
      owner.should.not.eq(ZERO_ADDRESS);
    });

    it('changes owner after transfer', async function () {
      const other = accounts[1];
      await this.ownable.transferOwnership(other);
      const owner = await this.ownable.owner();

      owner.should.eq(other);
    });

    it('should prevent non-owners from transfering', async function () {
      const other = accounts[2];
      const owner = await this.ownable.owner.call();
      owner.should.not.eq(other);
      await expectThrow(this.ownable.transferOwnership(other, { from: other }), EVMRevert);
    });

    it('should guard ownership against stuck state', async function () {
      const originalOwner = await this.ownable.owner();
      await expectThrow(this.ownable.transferOwnership(null, { from: originalOwner }), EVMRevert);
    });

    it('loses owner after renouncement', async function () {
      await this.ownable.renounceOwnership();
      const owner = await this.ownable.owner();

      owner.should.eq(ZERO_ADDRESS);
    });

    it('should prevent non-owners from renouncement', async function () {
      const other = accounts[2];
      const owner = await this.ownable.owner.call();
      owner.should.not.eq(other);
      await expectThrow(this.ownable.renounceOwnership({ from: other }), EVMRevert);
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
