const {
  expectEvent,
  expectRevert,
  time: { duration },
} = require('@openzeppelin/test-helpers');

const AccessManager = artifacts.require('AccessManager');
const AccessManaged = artifacts.require('$AccessManagedMock');

const badgeUtils = {
  mask: badge => 1n << BigInt(badge),
  decodeBitmap: hexBitmap => {
    const m = BigInt(hexBitmap);
    const allBadges = new Array(256).fill().map((_, i) => i.toString());
    return allBadges.filter(i => (m & badgeUtils.mask(i)) !== 0n);
  },
  role: badge => web3.utils.asciiToHex('badge:').padEnd(64, '0') + badge.toString(16).padStart(2, '0'),
};

contract('AccessManager', function ([admin, nonAdmin, user1, user2]) {
  beforeEach('deploy', async function () {
    this.delay = duration.days(1);
    this.manager = await AccessManager.new(this.delay, admin);
  });

  it('configures default admin rules', async function () {
    expect(await this.manager.defaultAdmin()).to.equal(admin);
    expect(await this.manager.defaultAdminDelay()).to.be.bignumber.equal(this.delay);
  });

  describe('badges', function () {
    const badge = '0';
    const name = 'dao';
    const otherBadge = '1';
    const otherName = 'council';

    describe('public badge', function () {
      const publicBadge = '255';

      it('is created automatically', async function () {
        await expectEvent.inConstruction(this.manager, 'BadgeUpdated', {
          badge: publicBadge,
          name: 'public',
        });
      });

      it('includes all users automatically', async function () {
        const badges = badgeUtils.decodeBitmap(await this.manager.getUserBadges(user1));
        expect(badges).to.include(publicBadge);
      });
    });

    describe('creating', function () {
      it('admin can create badges', async function () {
        const created = await this.manager.createBadge(badge, name, { from: admin });
        expectEvent(created, 'BadgeUpdated', { badge, name });
        expect(await this.manager.hasBadge(badge)).to.equal(true);
        expect(await this.manager.hasBadge(otherBadge)).to.equal(false);
      });

      it('non-admin cannot create badges', async function () {
        await expectRevert(this.manager.createBadge(badge, name, { from: nonAdmin }), 'missing role');
      });
    });

    describe('updating', function () {
      beforeEach('create badge', async function () {
        await this.manager.createBadge(badge, name, { from: admin });
      });

      it('admin can update badge', async function () {
        const updated = await this.manager.updateBadgeName(badge, otherName, { from: admin });
        expectEvent(updated, 'BadgeUpdated', { badge, name: otherName });
      });

      it('non-admin cannot update badge', async function () {
        await expectRevert(this.manager.updateBadgeName(badge, name, { from: nonAdmin }), 'missing role');
      });
    });

    describe('granting', function () {
      beforeEach('create badge', async function () {
        await this.manager.createBadge(badge, name, { from: admin });
      });

      it('admin can grant badge', async function () {
        const granted = await this.manager.grantBadge(user1, badge, { from: admin });
        expectEvent(granted, 'RoleGranted', { account: user1, role: badgeUtils.role(badge) });
        const badges = badgeUtils.decodeBitmap(await this.manager.getUserBadges(user1));
        expect(badges).to.include(badge);
      });

      it('non-admin cannot grant badge', async function () {
        await expectRevert(this.manager.grantBadge(user1, badge, { from: nonAdmin }), 'missing role');
      });
    });

    describe('revoking & renouncing', function () {
      beforeEach('create and grant badge', async function () {
        await this.manager.createBadge(badge, name, { from: admin });
        await this.manager.grantBadge(user1, badge, { from: admin });
      });

      it('admin can revoke badge', async function () {
        await this.manager.revokeBadge(user1, badge, { from: admin });
        const badges = badgeUtils.decodeBitmap(await this.manager.getUserBadges(user1));
        expect(badges).to.not.include(badge);
      });

      it('non-admin cannot revoke badge', async function () {
        await expectRevert(this.manager.revokeBadge(user1, badge, { from: nonAdmin }), 'missing role');
      });

      it('user can renounce badge', async function () {
        await this.manager.renounceBadge(user1, badge, { from: user1 });
        const badges = badgeUtils.decodeBitmap(await this.manager.getUserBadges(user1));
        expect(badges).to.not.include(badge);
      });

      it(`user cannot renounce other user's badges`, async function () {
        await expectRevert(
          this.manager.renounceBadge(user1, badge, { from: user2 }),
          'can only renounce roles for self',
        );
        await expectRevert(
          this.manager.renounceBadge(user2, badge, { from: user1 }),
          'can only renounce roles for self',
        );
      });
    });

    describe('querying', function () {
      it('returns expected badges', async function () {
        const getBadges = () => this.manager.getUserBadges(user1);

        // only public badge initially
        expect(await getBadges()).to.equal('0x8000000000000000000000000000000000000000000000000000000000000000');

        await this.manager.createBadge('0', '0', { from: admin });
        await this.manager.grantBadge(user1, '0', { from: admin });
        expect(await getBadges()).to.equal('0x8000000000000000000000000000000000000000000000000000000000000001');

        await this.manager.createBadge('1', '1', { from: admin });
        await this.manager.grantBadge(user1, '1', { from: admin });
        expect(await getBadges()).to.equal('0x8000000000000000000000000000000000000000000000000000000000000003');

        await this.manager.createBadge('16', '16', { from: admin });
        await this.manager.grantBadge(user1, '16', { from: admin });
        expect(await getBadges()).to.equal('0x8000000000000000000000000000000000000000000000000000000000010003');
      });
    });
  });

  describe('allowing', function () {
    const badge = '1';
    const badgeHolder = user1;
    const selector = web3.eth.abi.encodeFunctionSignature('restrictedFunction()');

    beforeEach('deploying managed contract', async function () {
      await this.manager.createBadge(badge, '', { from: admin });
      await this.manager.grantBadge(badgeHolder, badge, { from: admin });
      this.managed = await AccessManaged.new(this.manager.address);
    });

    it('allow', async function () {
      await this.manager.methods['setFunctionAllowedBadge(address,bytes4[],uint8,bool)'](
        this.managed.address,
        [selector],
        badge,
        true,
        { from: admin },
      );
      const restricted = await this.managed.restrictedFunction({ from: badgeHolder });
      expectEvent(restricted, 'RestrictedRan');
    });
  });

  describe('modes', function () {
    // TODO
  });
});
