const {
  expectEvent,
  expectRevert,
  time: { duration },
} = require('@openzeppelin/test-helpers');
const { RestrictedMode } = require('../../helpers/enums');

const AccessManager = artifacts.require('AccessManager');
const AccessManagerAdapter = artifacts.require('AccessManagerAdapter');
const AccessManaged = artifacts.require('$AccessManagedMock');

const Ownable = artifacts.require('$Ownable');
const AccessControl = artifacts.require('$AccessControl');

const groupUtils = {
  mask: group => 1n << BigInt(group),
  decodeBitmap: hexBitmap => {
    const m = BigInt(hexBitmap);
    const allGroups = new Array(256).fill().map((_, i) => i.toString());
    return allGroups.filter(i => (m & groupUtils.mask(i)) !== 0n);
  },
  role: group => web3.utils.asciiToHex('group:').padEnd(64, '0') + group.toString(16).padStart(2, '0'),
};

const PUBLIC_GROUP = '255';

contract('AccessManager', function ([admin, nonAdmin, user1, user2, otherAuthority]) {
  beforeEach('deploy', async function () {
    this.delay = duration.days(1);
    this.manager = await AccessManager.new(this.delay, admin);
  });

  it('configures default admin rules', async function () {
    expect(await this.manager.defaultAdmin()).to.equal(admin);
    expect(await this.manager.defaultAdminDelay()).to.be.bignumber.equal(this.delay);
  });

  describe('groups', function () {
    const group = '0';
    const name = 'dao';
    const otherGroup = '1';
    const otherName = 'council';

    describe('public group', function () {
      it('is created automatically', async function () {
        await expectEvent.inConstruction(this.manager, 'GroupUpdated', {
          group: PUBLIC_GROUP,
          name: 'public',
        });
      });

      it('includes all users automatically', async function () {
        const groups = groupUtils.decodeBitmap(await this.manager.getUserGroups(user1));
        expect(groups).to.include(PUBLIC_GROUP);
      });
    });

    describe('creating', function () {
      it('admin can create groups', async function () {
        const created = await this.manager.createGroup(group, name, { from: admin });
        expectEvent(created, 'GroupUpdated', { group, name });
        expect(await this.manager.hasGroup(group)).to.equal(true);
        expect(await this.manager.hasGroup(otherGroup)).to.equal(false);
      });

      it('non-admin cannot create groups', async function () {
        await expectRevert(this.manager.createGroup(group, name, { from: nonAdmin }), 'missing role');
      });

      it('cannot recreate a group', async function () {
        await this.manager.createGroup(group, name, { from: admin });
        await expectRevert(this.manager.createGroup(group, name, { from: admin }), 'AccessManager: existing group');
      });
    });

    describe('updating', function () {
      beforeEach('create group', async function () {
        await this.manager.createGroup(group, name, { from: admin });
      });

      it('admin can update group', async function () {
        const updated = await this.manager.updateGroupName(group, otherName, { from: admin });
        expectEvent(updated, 'GroupUpdated', { group, name: otherName });
      });

      it('non-admin cannot update group', async function () {
        await expectRevert(this.manager.updateGroupName(group, name, { from: nonAdmin }), 'missing role');
      });

      it('cannot update built in group', async function () {
        await expectRevert(
          this.manager.updateGroupName(PUBLIC_GROUP, name, { from: admin }),
          'AccessManager: built-in group',
        );
      });

      it('cannot update nonexistent group', async function () {
        await expectRevert(
          this.manager.updateGroupName(otherGroup, name, { from: admin }),
          'AccessManager: unknown group',
        );
      });
    });

    describe('granting', function () {
      beforeEach('create group', async function () {
        await this.manager.createGroup(group, name, { from: admin });
      });

      it('admin can grant group', async function () {
        const granted = await this.manager.grantGroup(user1, group, { from: admin });
        expectEvent(granted, 'RoleGranted', { account: user1, role: groupUtils.role(group) });
        const groups = groupUtils.decodeBitmap(await this.manager.getUserGroups(user1));
        expect(groups).to.include(group);
      });

      it('non-admin cannot grant group', async function () {
        await expectRevert(this.manager.grantGroup(user1, group, { from: nonAdmin }), 'missing role');
      });

      it('cannot grant nonexistent group', async function () {
        await expectRevert(this.manager.grantGroup(user1, otherGroup, { from: admin }), 'AccessManager: unknown group');
      });
    });

    describe('revoking & renouncing', function () {
      beforeEach('create and grant group', async function () {
        await this.manager.createGroup(group, name, { from: admin });
        await this.manager.grantGroup(user1, group, { from: admin });
      });

      it('admin can revoke group', async function () {
        await this.manager.revokeGroup(user1, group, { from: admin });
        const groups = groupUtils.decodeBitmap(await this.manager.getUserGroups(user1));
        expect(groups).to.not.include(group);
      });

      it('non-admin cannot revoke group', async function () {
        await expectRevert(this.manager.revokeGroup(user1, group, { from: nonAdmin }), 'missing role');
      });

      it('user can renounce group', async function () {
        await this.manager.renounceGroup(user1, group, { from: user1 });
        const groups = groupUtils.decodeBitmap(await this.manager.getUserGroups(user1));
        expect(groups).to.not.include(group);
      });

      it(`user cannot renounce other user's groups`, async function () {
        await expectRevert(
          this.manager.renounceGroup(user1, group, { from: user2 }),
          'can only renounce roles for self',
        );
        await expectRevert(
          this.manager.renounceGroup(user2, group, { from: user1 }),
          'can only renounce roles for self',
        );
      });

      it('cannot revoke public group', async function () {
        await expectRevert(
          this.manager.revokeGroup(user1, PUBLIC_GROUP, { from: admin }),
          'AccessManager: irrevocable group',
        );
      });

      it('cannot revoke nonexistent group', async function () {
        await expectRevert(
          this.manager.revokeGroup(user1, otherGroup, { from: admin }),
          'AccessManager: unknown group',
        );
        await expectRevert(
          this.manager.renounceGroup(user1, otherGroup, { from: user1 }),
          'AccessManager: unknown group',
        );
      });
    });

    describe('querying', function () {
      it('returns expected groups', async function () {
        const getGroups = () => this.manager.getUserGroups(user1);

        // only public group initially
        expect(await getGroups()).to.equal('0x8000000000000000000000000000000000000000000000000000000000000000');

        await this.manager.createGroup('0', '0', { from: admin });
        await this.manager.grantGroup(user1, '0', { from: admin });
        expect(await getGroups()).to.equal('0x8000000000000000000000000000000000000000000000000000000000000001');

        await this.manager.createGroup('1', '1', { from: admin });
        await this.manager.grantGroup(user1, '1', { from: admin });
        expect(await getGroups()).to.equal('0x8000000000000000000000000000000000000000000000000000000000000003');

        await this.manager.createGroup('16', '16', { from: admin });
        await this.manager.grantGroup(user1, '16', { from: admin });
        expect(await getGroups()).to.equal('0x8000000000000000000000000000000000000000000000000000000000010003');
      });
    });
  });

  describe('allowing', function () {
    const group = '1';
    const groupMember = user1;
    const selector = web3.eth.abi.encodeFunctionSignature('restrictedFunction()');

    beforeEach('deploying managed contract', async function () {
      await this.manager.createGroup(group, '', { from: admin });
      await this.manager.grantGroup(groupMember, group, { from: admin });
      this.managed = await AccessManaged.new(this.manager.address);
    });

    it('allow', async function () {
      await this.manager.methods['setFunctionAllowedGroup(address,bytes4[],uint8,bool)'](
        this.managed.address,
        [selector],
        group,
        true,
        { from: admin },
      );
      const restricted = await this.managed.restrictedFunction({ from: groupMember });
      expectEvent(restricted, 'RestrictedRan');
    });
  });

  describe('modes', function () {
    const group = '1';
    const selector = web3.eth.abi.encodeFunctionSignature('restrictedFunction()');

    beforeEach('deploying managed contract', async function () {
      this.managed = await AccessManaged.new(this.manager.address);
      await this.manager.createGroup('1', 'a group', { from: admin });
      await this.manager.setFunctionAllowedGroup(this.managed.address, [selector], group, true, { from: admin });
    });

    it('custom mode is default', async function () {
      expect(await this.manager.getContractMode(this.managed.address)).to.bignumber.equal(RestrictedMode.Custom);
      const allowedGroups = await this.manager.getFunctionAllowedGroups(this.managed.address, selector);
      expect(groupUtils.decodeBitmap(allowedGroups)).to.deep.equal([group]);
    });

    it('open mode', async function () {
      const receipt = await this.manager.setContractModeOpen(this.managed.address, { from: admin });
      expectEvent(receipt, 'RestrictedModeUpdated', {
        target: this.managed.address,
        mode: RestrictedMode.Open,
      });
      expect(await this.manager.getContractMode(this.managed.address)).to.bignumber.equal(RestrictedMode.Open);
      const allowedGroups = await this.manager.getFunctionAllowedGroups(this.managed.address, selector);
      expect(groupUtils.decodeBitmap(allowedGroups)).to.deep.equal([PUBLIC_GROUP]);
    });

    it('closed mode', async function () {
      const receipt = await this.manager.setContractModeClosed(this.managed.address, { from: admin });
      expectEvent(receipt, 'RestrictedModeUpdated', {
        target: this.managed.address,
        mode: RestrictedMode.Closed,
      });
      expect(await this.manager.getContractMode(this.managed.address)).to.bignumber.equal(RestrictedMode.Closed);
      const allowedGroups = await this.manager.getFunctionAllowedGroups(this.managed.address, selector);
      expect(groupUtils.decodeBitmap(allowedGroups)).to.deep.equal([]);
    });

    it('mode cycle', async function () {
      await this.manager.setContractModeOpen(this.managed.address, { from: admin });
      await this.manager.setContractModeClosed(this.managed.address, { from: admin });
      await this.manager.setContractModeCustom(this.managed.address, { from: admin });
      expect(await this.manager.getContractMode(this.managed.address)).to.bignumber.equal(RestrictedMode.Custom);
      const allowedGroups = await this.manager.getFunctionAllowedGroups(this.managed.address, selector);
      expect(groupUtils.decodeBitmap(allowedGroups)).to.deep.equal([group]);
    });

    it('non-admin cannot change mode', async function () {
      await expectRevert(this.manager.setContractModeCustom(this.managed.address), 'missing role');
      await expectRevert(this.manager.setContractModeOpen(this.managed.address), 'missing role');
      await expectRevert(this.manager.setContractModeClosed(this.managed.address), 'missing role');
    });
  });

  describe('transfering authority', function () {
    beforeEach('deploying managed contract', async function () {
      this.managed = await AccessManaged.new(this.manager.address);
    });

    it('admin can transfer authority', async function () {
      await this.manager.transferContractAuthority(this.managed.address, otherAuthority, { from: admin });
      expect(await this.managed.authority()).to.equal(otherAuthority);
    });

    it('non-admin cannot transfer authority', async function () {
      await expectRevert(
        this.manager.transferContractAuthority(this.managed.address, otherAuthority, { from: nonAdmin }),
        'missing role',
      );
    });
  });

  describe('adapter', function () {
    const group = '0';

    beforeEach('deploying adapter', async function () {
      await this.manager.createGroup(group, 'a group', { from: admin });
      await this.manager.grantGroup(user1, group, { from: admin });
      this.adapter = await AccessManagerAdapter.new(this.manager.address);
    });

    it('with ownable', async function () {
      const target = await Ownable.new();
      await target.transferOwnership(this.adapter.address);

      const { data } = await target.$_checkOwner.request();
      const selector = data.slice(0, 10);

      await expectRevert(
        this.adapter.relay(target.address, data, { from: user1 }),
        'AccessManagerAdapter: caller not allowed',
      );

      await this.manager.setFunctionAllowedGroup(target.address, [selector], group, true, { from: admin });
      await this.adapter.relay(target.address, data, { from: user1 });
    });

    it('with access control', async function () {
      const ROLE = web3.utils.soliditySha3('ROLE');
      const target = await AccessControl.new();
      await target.$_grantRole(ROLE, this.adapter.address);

      const { data } = await target.$_checkRole.request(ROLE);
      const selector = data.slice(0, 10);

      await expectRevert(
        this.adapter.relay(target.address, data, { from: user1 }),
        'AccessManagerAdapter: caller not allowed',
      );

      await this.manager.setFunctionAllowedGroup(target.address, [selector], group, true, { from: admin });
      await this.adapter.relay(target.address, data, { from: user1 });
    });

    it('transfer authority', async function () {
      await this.manager.transferContractAuthority(this.adapter.address, otherAuthority, { from: admin });
      expect(await this.adapter.authority()).to.equal(otherAuthority);
    });
  });
});
