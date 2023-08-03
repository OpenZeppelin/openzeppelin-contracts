const { constants } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../../helpers/customError');
const { AccessMode } = require('../../../helpers/enums');
const { selector } = require('../../../helpers/methods');

const AccessManager = artifacts.require('$AccessManager');
const Ownable = artifacts.require('$Ownable');

const groupId = web3.utils.toBN(1);

contract('AccessManager+Ownable', function (accounts) {
  const [admin, user, other] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);
    this.ownable = await Ownable.new(this.manager.address);

    // add user to group
    await this.manager.$_grantGroup(groupId, user, 0, 0);
  });

  it('initial state', async function () {
    expect(await this.ownable.owner()).to.be.equal(this.manager.address);
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
        this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user }),
        'AccessManagerUnauthorizedCall',
        [user, this.ownable.address, selector('$_checkOwner()')],
      );
    });

    it('relayed call (without group): reverts', async function () {
      await expectRevertCustomError(
        this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other }),
        'AccessManagerUnauthorizedCall',
        [other, this.ownable.address, selector('$_checkOwner()')],
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
      await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
    });

    it('relayed call (without group): success', async function () {
      await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other });
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
        await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
      });

      it('relayed call (without group): reverts', async function () {
        await expectRevertCustomError(
          this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other }),
          'AccessManagerUnauthorizedCall',
          [other, this.ownable.address, selector('$_checkOwner()')],
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
        await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: user });
      });

      it('relayed call (without group): success', async function () {
        await this.manager.relay(this.ownable.address, selector('$_checkOwner()'), { from: other });
      });
    });
  });

  it('bubble revert reasons', async function () {
    const { address } = await Ownable.new(admin);
    await this.manager.$_setContractMode(address, AccessMode.Open);

    await expectRevertCustomError(
      this.manager.relay(address, selector('$_checkOwner()')),
      'OwnableUnauthorizedAccount',
      [this.manager.address],
    );
  });
});
