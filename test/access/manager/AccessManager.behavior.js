const { time } = require('@openzeppelin/test-helpers');
const {
  time: { setNextBlockTimestamp },
  setStorageAt,
  mine,
} = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../../helpers/account');
const { expectRevertCustomError } = require('../../helpers/customError');
const { EXPIRATION } = require('../../helpers/access-manager');

// ============ COMMON PATHS ============

const COMMON_IS_EXECUTING_PATH = {
  executing: function () {
    it('succeeds', async function () {
      await callMethod.call(this);
    });
  },
  notExecuting: function () {
    it('reverts as AccessManagerUnauthorizedAccount', async function () {
      await expectRevertCustomError(callMethod.call(this), 'AccessManagerUnauthorizedAccount', [
        this.caller,
        this.role.id,
      ]);
    });
  },
};

const COMMON_GET_ACCESS_PATH = {
  roleGranted: {
    roleWithGrantDelay: {
      callerWithExecutionDelay: {
        before: function () {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expectRevertCustomError(callMethod.call(this), 'AccessManagerUnauthorizedAccount', [
              this.caller,
              this.role.id,
            ]);
          });
        },
        after: undefined, // Diverges if there's an operation delay or not
      },
      callerWithoutExecutionDelay: {
        before: function () {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expectRevertCustomError(callMethod.call(this), 'AccessManagerUnauthorizedAccount', [
              this.caller,
              this.role.id,
            ]);
          });
        },
        after: function () {
          it('succeeds', async function () {
            await callMethod.call(this);
          });
        },
      },
    },
    roleWithoutGrantDelay: {
      callerWithExecutionDelay: undefined, // Diverges if there's an operation to schedule or not
      callerWithoutExecutionDelay: function () {
        it('succeeds', async function () {
          await callMethod.call(this);
        });
      },
    },
  },
  roleNotGranted: function () {
    it('reverts as AccessManagerUnauthorizedAccount', async function () {
      await expectRevertCustomError(callMethod.call(this), 'AccessManagerUnauthorizedAccount', [
        this.caller,
        this.role.id,
      ]);
    });
  },
};

const COMMON_SCHEDULABLE_PATH = {
  scheduled: {
    before: function () {
      it('reverts as AccessManagerNotReady', async function () {
        await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotReady', [this.operationId]);
      });
    },
    after: function () {
      it('succeeds', async function () {
        await callMethod.call(this);
      });
    },
    expired: function () {
      it('reverts as AccessManagerExpired', async function () {
        await expectRevertCustomError(callMethod.call(this), 'AccessManagerExpired', [this.operationId]);
      });
    },
  },
  notScheduled: function () {
    it('reverts as AccessManagerNotScheduled', async function () {
      await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotScheduled', [this.operationId]);
    });
  },
};

// ============ MODE HELPERS ============

/**
 * @requires this.{manager,target}
 */
function shouldBehaveLikeClosable({ closed, open }) {
  describe('when closed', function () {
    beforeEach('close', async function () {
      await this.manager.$_setTargetClosed(this.target.address, true);
    });

    closed.call(this);
  });

  describe('when open', function () {
    beforeEach('open', async function () {
      await this.manager.$_setTargetClosed(this.target.address, false);
    });

    open.call(this);
  });
}

// ============ DELAY HELPERS ============

/**
 * @requires this.{delay}
 */
function shouldBehaveLikeDelay(type, { before, after }) {
  beforeEach('set effect timestamp', async function () {
    const timestamp = await time.latest();
    this.delayEffect = timestamp.add(this.delay);
  });

  describe(`when ${type} delay has not passed`, function () {
    beforeEach(`set ${type} delay passed`, async function () {
      await setNextBlockTimestamp(this.delayEffect.subn(1));
    });

    before.call(this);
  });

  describe(`when ${type} delay has passed`, function () {
    beforeEach(`set ${type} delay passed`, async function () {
      await setNextBlockTimestamp(this.delayEffect);
    });

    after.call(this);
  });
}

// ============ OPERATION HELPERS ============

/**
 * @requires this.{manager,scheduleIn,caller,target,calldata}
 */
function shouldBehaveLikeSchedulableOperation({ scheduled: { before, after, expired }, notScheduled }) {
  describe('when operation is scheduled', function () {
    beforeEach('schedule operation', async function () {
      this.delay = this.scheduleIn;
      const { operationId } = await scheduleOperation.call(this);
      this.operationId = operationId;
    });

    describe('when execution time has not passed', function () {
      beforeEach('set execution time not passed', async function () {
        this.scheduledAt = await time.latest();
        const schedule = await this.manager.getSchedule(this.operationId);
        await setNextBlockTimestamp(schedule.subn(1));
      });

      before.call(this);
    });

    describe('when execution time has passed', function () {
      beforeEach('set execution time passed', async function () {
        this.scheduledAt = await time.latest();
        const schedule = await this.manager.getSchedule(this.operationId);
        await setNextBlockTimestamp(schedule);
      });

      after.call(this);
    });

    describe('when execution time has expired', function () {
      beforeEach('set execution time expired', async function () {
        this.scheduledAt = await time.latest();
        const schedule = await this.manager.getSchedule(this.operationId);
        await setNextBlockTimestamp(schedule.add(EXPIRATION));
      });

      expired.call(this);
    });
  });

  describe('when operation is not scheduled', function () {
    beforeEach('set expected operationId', async function () {
      this.operationId = await this.manager.hashOperation(this.caller, this.target.address, this.calldata);
    });

    beforeEach('assert operation is not scheduled', async function () {
      expect(await this.manager.getSchedule(this.operationId)).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    notScheduled.call(this);
  });
}

/**
 * @requires this.{manager,roles,target,calldata}
 */
function shouldBehaveLikeARestrictedOperation({ externalCaller, managerCaller }) {
  describe('when caller is the manager', function () {
    beforeEach('set caller as manager', async function () {
      this.caller = this.manager.address;
      await impersonate(this.caller);
    });

    shouldBehaveLikeCanCallExecuting.call(this, managerCaller);
  });

  describe('when caller is not the manager', function () {
    beforeEach('set non manager caller', function () {
      this.caller = this.roles.SOME.members[0];
    });

    externalCaller.call(this);
  });
}

/**
 * @requires this.{manager,roles,executionDelay,operationDelay,target}
 */
function shouldBehaveLikeDelayedOperation() {
  describe('with operation delay', function () {
    describe('when operation delay is greater than execution delay', function () {
      beforeEach('set operation delay', async function () {
        this.operationDelay = this.executionDelay.add(time.duration.hours(1));
        await this.manager.$_setTargetAdminDelay(this.target.address, this.operationDelay);

        this.scheduleIn = this.operationDelay;
      });

      shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
    });

    describe('when operation delay is shorter than execution delay', function () {
      beforeEach('set operation delay', async function () {
        this.operationDelay = this.executionDelay.sub(time.duration.hours(1));
        await this.manager.$_setTargetAdminDelay(this.target.address, this.operationDelay);

        this.scheduleIn = this.executionDelay;
      });

      shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
    });
  });

  describe('without operation delay', function () {
    beforeEach('set operation delay', async function () {
      this.operationDelay = web3.utils.toBN(0);
      await this.manager.$_setTargetAdminDelay(this.target.address, this.operationDelay);
      this.scheduleIn = this.executionDelay;
    });

    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  });
}

// ============ METHOD HELPERS ============

/**
 * @requires this.{manager,roles,target,calldata}
 */
function shouldBehaveLikeCanCall({
  closed,
  open: {
    managerCaller,
    externalCaller: { requiredPublicRole, notRequiredPublicRole },
  },
}) {
  shouldBehaveLikeClosable.call(this, {
    closed,
    open: function () {
      shouldBehaveLikeARestrictedOperation.call(this, {
        managerCaller,
        externalCaller: function () {
          shouldBehaveLikeHasRole.call(this, {
            requiredPublicRole,
            notRequiredPublicRole,
          });
        },
      });
    },
  });
}

/**
 * @requires this.{target,calldata}
 */
function shouldBehaveLikeCanCallExecuting({ executing, notExecuting }) {
  describe('when is executing', function () {
    beforeEach('set _executionId flag from calldata and target', async function () {
      const executionId = await web3.utils.keccak256(
        web3.eth.abi.encodeParameters(['address', 'bytes4'], [this.target.address, this.calldata.substring(0, 10)]),
      );
      await setStorageAt(this.manager.address, 3, executionId);
    });

    executing.call(this);
  });

  describe('when is not executing', notExecuting);
}

/**
 * @requires this.{target,calldata,roles,role}
 */
function shouldBehaveLikeHasRole({ requiredPublicRole, notRequiredPublicRole }) {
  describe('when required role is PUBLIC_ROLE', function () {
    beforeEach('set required role as PUBLIC_ROLE', async function () {
      this.role = this.roles.PUBLIC;
      await this.manager.$_setTargetFunctionRole(this.target.address, this.calldata.substring(0, 10), this.role.id, {
        from: this.roles.ADMIN.members[0],
      });
    });

    requiredPublicRole.call(this);
  });

  describe('when required role is not PUBLIC_ROLE', function () {
    beforeEach('set required role', async function () {
      await this.manager.$_setTargetFunctionRole(this.target.address, this.calldata.substring(0, 10), this.role.id, {
        from: this.roles.ADMIN.members[0],
      });
    });

    shouldBehaveLikeGetAccess.call(this, notRequiredPublicRole);
  });
}

/**
 * @requires this.{manager,role,caller}
 */
function shouldBehaveLikeGetAccess({
  roleGranted: {
    roleWithGrantDelay: { callerWithExecutionDelay: case1, callerWithoutExecutionDelay: case2 },
    roleWithoutGrantDelay: { callerWithExecutionDelay: case3, callerWithoutExecutionDelay: case4 },
  },
  roleNotGranted,
}) {
  describe('when role is granted', function () {
    describe('with grant delay', function () {
      beforeEach('set delay', async function () {
        this.grantDelay = time.duration.minutes(3);
      });

      describe('with caller execution delay', function () {
        beforeEach('set role and delays', async function () {
          this.executionDelay = time.duration.hours(10);
          this.delay = this.grantDelay;
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        shouldBehaveLikeDelay.call(this, 'grant', case1);
      });

      describe('without caller execution delay', function () {
        beforeEach('set role and delays', async function () {
          this.delay = this.grantDelay;
          this.executionDelay = web3.utils.toBN(0);
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        shouldBehaveLikeDelay.call(this, 'grant', case2);
      });
    });

    describe('without grant delay', function () {
      beforeEach('set delay', function () {
        this.grantDelay = web3.utils.toBN(0);
      });

      describe('with caller execution delay', function () {
        beforeEach('set role and delay', async function () {
          this.executionDelay = time.duration.hours(10);
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
          this.scheduleIn = this.executionDelay;
        });

        case3.call(this);
      });

      describe('without caller execution delay', function () {
        beforeEach('set role and delay ', async function () {
          this.executionDelay = web3.utils.toBN(0);
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        case4.call(this);
      });
    });
  });

  describe('when role is not granted', function () {
    // Because this helper can be composed with other helpers, it's possible
    // that role has been set already by another helper.
    // Although this is highly unlikely, we check for it here to avoid false positives.
    beforeEach('assert role is unset', async function () {
      const { since } = await this.manager.getAccess(this.role.id, this.caller);
      expect(since).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    roleNotGranted.call(this);
  });
}

// ============ ADMIN OPERATION HELPERS ============

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeDelayedAdminOperation() {
  const getAccessPath = COMMON_GET_ACCESS_PATH;
  getAccessPath.roleGranted.roleWithGrantDelay.callerWithExecutionDelay.after = function () {
    beforeEach('consume previously set grant delay', async function () {
      // Consume previously set delay
      await mine();
    });
    shouldBehaveLikeDelayedOperation.call(this);
  };
  getAccessPath.roleGranted.roleWithoutGrantDelay.callerWithExecutionDelay = function () {
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  shouldBehaveLikeARestrictedOperation.call(this, {
    managerCaller: COMMON_IS_EXECUTING_PATH,
    externalCaller: function () {
      shouldBehaveLikeHasRole.call(this, {
        requiredPublicRole: function () {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expectRevertCustomError(callMethod.call(this), 'AccessManagerUnauthorizedAccount', [
              this.caller,
              this.roles.ADMIN.id, // Although PUBLIC is required, target function role doesn't apply to admin ops
            ]);
          });
        },
        notRequiredPublicRole: getAccessPath,
      });
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeNotDelayedAdminOperation() {
  const getAccessPath = COMMON_GET_ACCESS_PATH;
  getAccessPath.roleGranted.roleWithGrantDelay.callerWithExecutionDelay.after = function () {
    beforeEach('set operation delay', async function () {
      await mine();
      this.scheduleIn = this.executionDelay;
    });
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };
  getAccessPath.roleGranted.roleWithoutGrantDelay.callerWithExecutionDelay = function () {
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  shouldBehaveLikeARestrictedOperation.call(this, {
    managerCaller: COMMON_IS_EXECUTING_PATH,
    externalCaller: function () {
      shouldBehaveLikeHasRole.call(this, {
        requiredPublicRole: function () {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expectRevertCustomError(
              web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
              'AccessManagerUnauthorizedAccount',
              [this.caller, this.roles.ADMIN.id], // Although PUBLIC_ROLE is required, admin ops are not subject to target function roles
            );
          });
        },
        notRequiredPublicRole: getAccessPath,
      });
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeRoleAdminOperation(roleAdmin) {
  const getAccessPath = COMMON_GET_ACCESS_PATH;
  getAccessPath.roleGranted.roleWithGrantDelay.callerWithExecutionDelay.after = function () {
    beforeEach('set operation delay', async function () {
      await mine();
      this.scheduleIn = this.executionDelay;
    });
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };
  getAccessPath.roleGranted.roleWithoutGrantDelay.callerWithExecutionDelay = function () {
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  shouldBehaveLikeARestrictedOperation.call(this, {
    managerCaller: COMMON_IS_EXECUTING_PATH,
    externalCaller: function () {
      shouldBehaveLikeHasRole.call(this, {
        requiredPublicRole: function () {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expectRevertCustomError(
              web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
              'AccessManagerUnauthorizedAccount',
              [this.caller, roleAdmin], // Role admin ops require the role's admin
            );
          });
        },
        notRequiredPublicRole: getAccessPath,
      });
    },
  });
}

// ============ RESTRICTED OPERATION HELPERS ============

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeAManagedRestrictedOperation() {
  function revertUnauthorized() {
    it('reverts as AccessManagedUnauthorized', async function () {
      await expectRevertCustomError(callMethod.call(this), 'AccessManagedUnauthorized', [this.caller]);
    });
  }

  const getAccessPath = COMMON_GET_ACCESS_PATH;

  getAccessPath.roleGranted.roleWithGrantDelay.callerWithExecutionDelay.before = revertUnauthorized;
  getAccessPath.roleGranted.roleWithGrantDelay.callerWithoutExecutionDelay.before = revertUnauthorized;
  getAccessPath.roleNotGranted = revertUnauthorized;

  getAccessPath.roleGranted.roleWithGrantDelay.callerWithExecutionDelay.after = function () {
    beforeEach('consume previously set grant delay', async function () {
      // Consume previously set delay
      await mine();
      this.scheduleIn = this.executionDelay;
    });
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };
  getAccessPath.roleGranted.roleWithoutGrantDelay.callerWithExecutionDelay = function () {
    shouldBehaveLikeSchedulableOperation.call(this, COMMON_SCHEDULABLE_PATH);
  };

  const isExecutingPath = COMMON_IS_EXECUTING_PATH;
  isExecutingPath.notExecuting = revertUnauthorized;

  shouldBehaveLikeCanCall({
    closed: revertUnauthorized,
    open: {
      managerCaller: isExecutingPath,
      externalCaller: {
        requiredPublicRole: function () {
          it('succeeds', async function () {
            await callMethod.call(this);
          });
        },
        notRequiredPublicRole: getAccessPath,
      },
    },
  });
}

// ============ HELPERS ============

/**
 * @requires this.{manager, caller, target, calldata}
 */
async function scheduleOperation() {
  const timestamp = await time.latest();
  const nextTimestamp = timestamp.addn(1);
  await setNextBlockTimestamp(nextTimestamp); // Fix next block timestamp for predictability
  await this.manager.schedule(this.target.address, this.calldata, nextTimestamp.add(this.delay), {
    from: this.caller,
  });

  return {
    operationId: await this.manager.hashOperation(this.caller, this.target.address, this.calldata),
  };
}

/**
 * @requires this.{target, calldata, caller}
 */
function callMethod() {
  return web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller });
}

module.exports = {
  // MODE HELPERS
  shouldBehaveLikeClosable,
  // DELAY HELPERS
  shouldBehaveLikeDelay,
  // OPERATION HELPERS
  shouldBehaveLikeSchedulableOperation,
  // METHOD HELPERS
  shouldBehaveLikeCanCall,
  shouldBehaveLikeGetAccess,
  shouldBehaveLikeHasRole,
  // ADMIN OPERATION HELPERS
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeNotDelayedAdminOperation,
  shouldBehaveLikeRoleAdminOperation,
  // RESTRICTED OPERATION HELPERS
  shouldBehaveLikeAManagedRestrictedOperation,
  // HELPERS
  scheduleOperation,
};
