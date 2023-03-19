const { expectEvent, expectRevert, time: { duration } } = require('@openzeppelin/test-helpers');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

const AccessManager = artifacts.require('$AccessManager');
const AccessManaged = artifacts.require('$AccessManaged');

const badgeMask = badge => 1n << BigInt(badge);

contract('AccessManager', function ([admin, nonAdmin, user1]) {
  beforeEach('deploy', async function () {
    this.delay = duration.days(1);
    this.manager = await AccessManager.new(this.delay, admin);
    this.managed = await AccessManaged.new(this.manager.address);
  });

  it('configures default admin rules', async function () {
    expect(await this.manager.defaultAdmin()).to.equal(admin);
    expect(await this.manager.defaultAdminDelay()).to.be.bignumber.equal(this.delay);
  });

  describe('public badge', function () {
    const publicBadge = '255';

    it('is created automatically', async function () {
      await expectEvent.inConstruction(this.manager, 'BadgeUpdated', {
        badge: publicBadge,
        name: 'public',
      });
    });

    it('includes all users automatically', async function () {
      const user1Badges = await this.manager.getUserBadges(user1);

      expect(BigInt(user1Badges) & badgeMask(publicBadge)).to.not.equal(0n);
    });
  });

  describe('badges', function () {
    const badge = '1';
    const name = 'dao';
    const otherBadge = '2';
    const otherName = 'council';

    it('can create badges', async function () {
      const created = await this.manager.createBadge(badge, name, { from: admin });
      expectEvent(created, 'BadgeUpdated', { badge, name });
      expect(await this.manager.hasBadge(badge)).to.equal(true);
      expect(await this.manager.hasBadge(otherBadge)).to.equal(false);
    });

    it('only admin can create badges', async function () {
      await expectRevert(
        this.manager.createBadge(badge, name, { from: nonAdmin }),
        'missing role',
      );
    });

    it('can update badge', async function () {
      await this.manager.createBadge(badge, name, { from: admin });
      const updated = await this.manager.updateBadgeName(badge, otherName, { from: admin });
      expectEvent(updated, 'BadgeUpdated', { badge, name: otherName });
    });
  });
});
