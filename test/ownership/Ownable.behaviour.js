import assertRevert from '../helpers/assertRevert';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export default function (accounts) {
  describe('as an ownable', function () {
    it('should have an owner', async function () {
      let owner = await this.ownable.owner();
      assert.isTrue(owner !== 0);
    });

    it('changes owner after transfer', async function () {
      let other = accounts[1];
      await this.ownable.transferOwnership(other);
      let owner = await this.ownable.owner();

      assert.isTrue(owner === other);
    });

    it('should prevent non-owners from transfering', async function () {
      const other = accounts[2];
      const owner = await this.ownable.owner.call();
      assert.isTrue(owner !== other);
      await assertRevert(this.ownable.transferOwnership(other, { from: other }));
    });

    it('should guard ownership against stuck state', async function () {
      let originalOwner = await this.ownable.owner();
      await assertRevert(this.ownable.transferOwnership(null, { from: originalOwner }));
    });

    it('loses owner after renouncement', async function () {
      await this.ownable.renounceOwnership();
      let owner = await this.ownable.owner();

      assert.isTrue(owner === ZERO_ADDRESS);
    });

    it('should prevent non-owners from renouncement', async function () {
      const other = accounts[2];
      const owner = await this.ownable.owner.call();
      assert.isTrue(owner !== other);
      await assertRevert(this.ownable.renounceOwnership({ from: other }));
    });
  });
};
