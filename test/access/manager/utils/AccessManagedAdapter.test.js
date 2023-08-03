const { constants, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../../helpers/customError');
const { AccessMode } = require('../../../helpers/enums');
const { selector } = require('../../../helpers/methods');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedAdapter = artifacts.require('AccessManagedAdapter');
const Ownable = artifacts.require('$Ownable');

const groupId = web3.utils.toBN(1);

contract('AccessManagedAdapter', function (accounts) {
  const [admin, user, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);
    this.adapter = await AccessManagedAdapter.new(this.manager.address);
    this.ownable = await Ownable.new(this.adapter.address);

    // add user to group
    await this.manager.$_grantGroup(groupId, user, 0, 0);
  });

  it('initial state', async function () {
    expect(await this.adapter.authority()).to.be.equal(this.manager.address);
    expect(await this.ownable.owner()).to.be.equal(this.adapter.address);
  });

  describe('Contract is Closed', function () {
    beforeEach(async function () {
      await this.manager.$_setContractMode(this.ownable.address, AccessMode.Closed);
    });

    it('directly call: reverts', async function () {
      await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
    });

    it('relayed call (with group): reverts', async function () {
      await expectRevertCustomError(
        this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: user }),
        'AccessManagedUnauthorized',
        [user],
      );
    });

    it('relayed call (without group): reverts', async function () {
      await expectRevertCustomError(
        this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: other }),
        'AccessManagedUnauthorized',
        [other],
      );
    });
  });

  describe('Contract is Open', function () {
    beforeEach(async function () {
      await this.manager.$_setContractMode(this.ownable.address, AccessMode.Open);
    });

    it('directly call: reverts', async function () {
      await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
    });

    it('relayed call (with group): success', async function () {
      await this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
    });

    it('relayed call (without group): success', async function () {
      await this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: other });
    });
  });

  describe('Contract is in Custom mode', function () {
    beforeEach(async function () {
      await this.manager.$_setContractMode(this.ownable.address, AccessMode.Custom);
    });

    describe('function is open to specific group', function () {
      beforeEach(async function () {
        await this.manager.$_setFunctionAllowedGroup(this.ownable.address, selector('$_checkOwner()'), groupId);
      });

      it('directly call: reverts', async function () {
        await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
      });

      it('relayed call (with group): success', async function () {
        await this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
      });

      it('relayed call (without group): reverts', async function () {
        await expectRevertCustomError(
          this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: other }),
          'AccessManagedUnauthorized',
          [other],
        );
      });
    });

    describe('function is open to public group', function () {
      beforeEach(async function () {
        await this.manager.$_setFunctionAllowedGroup(
          this.ownable.address,
          selector('$_checkOwner()'),
          constants.MAX_UINT256,
        );
      });

      it('directly call: reverts', async function () {
        await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
      });

      it('relayed call (with group): success', async function () {
        await this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
      });

      it('relayed call (without group): success', async function () {
        await this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: other });
      });
    });

    describe('function is available with execution delay', function () {
      const delay = 10;

      beforeEach(async function () {
        await this.manager.$_setExecuteDelay(groupId, user, delay);
        await this.manager.$_setFunctionAllowedGroup(this.ownable.address, selector('$_checkOwner()'), groupId);
      });

      it('unscheduled call reverts', async function () {
        await expectRevertCustomError(
          this.adapter.relay(this.ownable.address, selector('$_checkOwner()'), { from: user }),
          'AccessManagedRequiredDelay',
          [user, delay],
        );
      });

      it('scheduled call succeeds', async function () {
        await this.manager.schedule(this.ownable.address, selector('$_checkOwner()'), { from: user });
        await time.increase(delay);
        await this.manager.relayViaAdapter(this.ownable.address, selector('$_checkOwner()'), this.adapter.address, {
          from: user,
        });
      });
    });
  });

  it('bubble revert reasons', async function () {
    const { address } = await Ownable.new(admin);
    await this.manager.$_setContractMode(address, AccessMode.Open);

    await expectRevertCustomError(
      this.adapter.relay(address, selector('$_checkOwner()')),
      'OwnableUnauthorizedAccount',
      [this.adapter.address],
    );
  });
});
