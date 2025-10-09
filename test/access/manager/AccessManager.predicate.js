const { ethers } = require('hardhat');
const { expect } = require('chai');
const { setStorageAt } = require('@nomicfoundation/hardhat-network-helpers');

const { EXECUTION_ID_STORAGE_SLOT, EXPIRATION, prepareOperation } = require('../../helpers/access-manager');
const { impersonate } = require('../../helpers/account');
const time = require('../../helpers/time');

// ============ COMMON PREDICATES ============

const LIKE_COMMON_IS_EXECUTING = {
  executing() {
    it('succeeds', async function () {
      await this.caller.sendTransaction({ to: this.target, data: this.calldata });
    });
  },
  notExecuting() {
    it('reverts as AccessManagerUnauthorizedAccount', async function () {
      await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedAccount')
        .withArgs(this.caller, this.role.id);
    });
  },
};

const LIKE_COMMON_GET_ACCESS = {
  requiredRoleIsGranted: {
    roleGrantingIsDelayed: {
      callerHasAnExecutionDelay: {
        beforeGrantDelay() {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedAccount')
              .withArgs(this.caller, this.role.id);
          });
        },
        afterGrantDelay: undefined, // Diverges if there's an operation delay or not
      },
      callerHasNoExecutionDelay: {
        beforeGrantDelay() {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedAccount')
              .withArgs(this.caller, this.role.id);
          });
        },
        afterGrantDelay() {
          it('succeeds called directly', async function () {
            await this.caller.sendTransaction({ to: this.target, data: this.calldata });
          });

          it('succeeds via execute', async function () {
            await this.manager.connect(this.caller).execute(this.target, this.calldata);
          });
        },
      },
    },
    roleGrantingIsNotDelayed: {
      callerHasAnExecutionDelay: undefined, // Diverges if there's an operation to schedule or not
      callerHasNoExecutionDelay() {
        it('succeeds called directly', async function () {
          await this.caller.sendTransaction({ to: this.target, data: this.calldata });
        });

        it('succeeds via execute', async function () {
          await this.manager.connect(this.caller).execute(this.target, this.calldata);
        });
      },
    },
  },
  requiredRoleIsNotGranted() {
    it('reverts as AccessManagerUnauthorizedAccount', async function () {
      await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedAccount')
        .withArgs(this.caller, this.role.id);
    });
  },
};

const LIKE_COMMON_SCHEDULABLE = {
  scheduled: {
    before() {
      it('reverts as AccessManagerNotReady', async function () {
        await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
          .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotReady')
          .withArgs(this.operationId);
      });
    },
    after() {
      it('succeeds called directly', async function () {
        await this.caller.sendTransaction({ to: this.target, data: this.calldata });
      });

      it('succeeds via execute', async function () {
        await this.manager.connect(this.caller).execute(this.target, this.calldata);
      });
    },
    expired() {
      it('reverts as AccessManagerExpired', async function () {
        await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
          .to.be.revertedWithCustomError(this.manager, 'AccessManagerExpired')
          .withArgs(this.operationId);
      });
    },
  },
  notScheduled() {
    it('reverts as AccessManagerNotScheduled', async function () {
      await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotScheduled')
        .withArgs(this.operationId);
    });
  },
};

// ============ MODE ============

/**
 * @requires this.{manager,target}
 */
function testAsClosable({ closed, open }) {
  describe('when the manager is closed', function () {
    beforeEach('close', async function () {
      await this.manager.$_setTargetClosed(this.target, true);
    });

    closed();
  });

  describe('when the manager is open', function () {
    beforeEach('open', async function () {
      await this.manager.$_setTargetClosed(this.target, false);
    });

    open();
  });
}

// ============ DELAY ============

/**
 * @requires this.{delay}
 */
function testAsDelay(type, { before, after }) {
  beforeEach('define timestamp when delay takes effect', async function () {
    const timestamp = await time.clock.timestamp();
    this.delayEffect = timestamp + this.delay;
  });

  describe(`when ${type} delay has not taken effect yet`, function () {
    beforeEach(`set next block timestamp before ${type} takes effect`, async function () {
      await time.increaseTo.timestamp(this.delayEffect - 1n, !!before.mineDelay);
    });

    before();
  });

  describe(`when ${type} delay has taken effect`, function () {
    beforeEach(`set next block timestamp when ${type} takes effect`, async function () {
      await time.increaseTo.timestamp(this.delayEffect, !!after.mineDelay);
    });

    after();
  });
}

// ============ OPERATION ============

/**
 * @requires this.{manager,scheduleIn,caller,target,calldata}
 */
function testAsSchedulableOperation({ scheduled: { before, after, expired }, notScheduled }) {
  describe('when operation is scheduled', function () {
    beforeEach('schedule operation', async function () {
      if (this.caller.target) {
        await impersonate(this.caller.target);
        this.caller = await ethers.getSigner(this.caller.target);
      }
      const { operationId, schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.scheduleIn,
      });
      await schedule();
      this.operationId = operationId;
    });

    describe('when operation is not ready for execution', function () {
      beforeEach('set next block time before operation is ready', async function () {
        this.scheduledAt = await time.clock.timestamp();
        const schedule = await this.manager.getSchedule(this.operationId);
        await time.increaseTo.timestamp(schedule - 1n, !!before.mineDelay);
      });

      before();
    });

    describe('when operation is ready for execution', function () {
      beforeEach('set next block time when operation is ready for execution', async function () {
        this.scheduledAt = await time.clock.timestamp();
        const schedule = await this.manager.getSchedule(this.operationId);
        await time.increaseTo.timestamp(schedule, !!after.mineDelay);
      });

      after();
    });

    describe('when operation has expired', function () {
      beforeEach('set next block time when operation expired', async function () {
        this.scheduledAt = await time.clock.timestamp();
        const schedule = await this.manager.getSchedule(this.operationId);
        await time.increaseTo.timestamp(schedule + EXPIRATION, !!expired.mineDelay);
      });

      expired();
    });
  });

  describe('when operation is not scheduled', function () {
    beforeEach('set expected operationId', async function () {
      this.operationId = await this.manager.hashOperation(this.caller, this.target, this.calldata);

      // Assert operation is not scheduled
      expect(await this.manager.getSchedule(this.operationId)).to.equal(0n);
    });

    notScheduled();
  });
}

/**
 * @requires this.{manager,roles,target,calldata}
 */
function testAsRestrictedOperation({ callerIsTheManager: { executing, notExecuting }, callerIsNotTheManager }) {
  describe('when the call comes from the manager (msg.sender == manager)', function () {
    beforeEach('define caller as manager', async function () {
      this.caller = this.manager;
      if (this.caller.target) {
        await impersonate(this.caller.target);
        this.caller = await ethers.getSigner(this.caller.target);
      }
    });

    describe('when _executionId is in storage for target and selector', function () {
      beforeEach('set _executionId flag from calldata and target', async function () {
        const executionId = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'bytes4'],
            [this.target.target, this.calldata.substring(0, 10)],
          ),
        );
        await setStorageAt(this.manager.target, EXECUTION_ID_STORAGE_SLOT, executionId);
      });

      executing();
    });

    describe('when _executionId does not match target and selector', notExecuting);
  });

  describe('when the call does not come from the manager (msg.sender != manager)', function () {
    beforeEach('define non manager caller', function () {
      this.caller = this.roles.SOME.members[0];
    });

    callerIsNotTheManager();
  });
}

/**
 * @requires this.{manager,scheduleIn,caller,target,calldata,executionDelay}
 */
function testAsDelayedOperation() {
  describe('with operation delay', function () {
    describe('when operation delay is greater than execution delay', function () {
      beforeEach('set operation delay', async function () {
        this.operationDelay = this.executionDelay + time.duration.hours(1);
        await this.manager.$_setTargetAdminDelay(this.target, this.operationDelay);
        this.scheduleIn = this.operationDelay; // For testAsSchedulableOperation
      });

      testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
    });

    describe('when operation delay is shorter than execution delay', function () {
      beforeEach('set operation delay', async function () {
        this.operationDelay = this.executionDelay - time.duration.hours(1);
        await this.manager.$_setTargetAdminDelay(this.target, this.operationDelay);
        this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
      });

      testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
    });
  });

  describe('without operation delay', function () {
    beforeEach('set operation delay', async function () {
      this.operationDelay = 0n;
      await this.manager.$_setTargetAdminDelay(this.target, this.operationDelay);
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
    });

    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  });
}

// ============ METHOD ============

/**
 * @requires this.{manager,roles,role,target,calldata}
 */
function testAsCanCall({
  closed,
  open: {
    callerIsTheManager,
    callerIsNotTheManager: { publicRoleIsRequired, specificRoleIsRequired },
  },
}) {
  testAsClosable({
    closed,
    open() {
      testAsRestrictedOperation({
        callerIsTheManager,
        callerIsNotTheManager() {
          testAsHasRole({
            publicRoleIsRequired,
            specificRoleIsRequired,
          });
        },
      });
    },
  });
}

/**
 * @requires this.{target,calldata,roles,role}
 */
function testAsHasRole({ publicRoleIsRequired, specificRoleIsRequired }) {
  describe('when the function requires the caller to be granted with the PUBLIC_ROLE', function () {
    beforeEach('set target function role as PUBLIC_ROLE', async function () {
      this.role = this.roles.PUBLIC;
      await this.manager
        .connect(this.roles.ADMIN.members[0])
        .$_setTargetFunctionRole(this.target, this.calldata.substring(0, 10), this.role.id);
    });

    publicRoleIsRequired();
  });

  describe('when the function requires the caller to be granted with a role other than PUBLIC_ROLE', function () {
    beforeEach('set target function role as PUBLIC_ROLE', async function () {
      await this.manager
        .connect(this.roles.ADMIN.members[0])
        .$_setTargetFunctionRole(this.target, this.calldata.substring(0, 10), this.role.id);
    });

    testAsGetAccess(specificRoleIsRequired);
  });
}

/**
 * @requires this.{manager,role,caller}
 */
function testAsGetAccess({
  requiredRoleIsGranted: {
    roleGrantingIsDelayed: {
      // Because both grant and execution delay are set within the same $_grantRole call
      // it's not possible to create a set of tests that diverge between grant and execution delay.
      // Therefore, the testAsDelay arguments are renamed for clarity:
      // before => beforeGrantDelay
      // after => afterGrantDelay
      callerHasAnExecutionDelay: { beforeGrantDelay: case1, afterGrantDelay: case2 },
      callerHasNoExecutionDelay: { beforeGrantDelay: case3, afterGrantDelay: case4 },
    },
    roleGrantingIsNotDelayed: { callerHasAnExecutionDelay: case5, callerHasNoExecutionDelay: case6 },
  },
  requiredRoleIsNotGranted,
}) {
  describe('when the required role is granted to the caller', function () {
    describe('when role granting is delayed', function () {
      beforeEach('define delay', function () {
        this.grantDelay = time.duration.minutes(3);
        this.delay = this.grantDelay; // For testAsDelay
      });

      describe('when caller has an execution delay', function () {
        beforeEach('set role and delay', async function () {
          this.executionDelay = time.duration.hours(10);
          this.delay = this.grantDelay;
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        testAsDelay('grant', { before: case1, after: case2 });
      });

      describe('when caller has no execution delay', function () {
        beforeEach('set role and delay', async function () {
          this.executionDelay = 0n;
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        testAsDelay('grant', { before: case3, after: case4 });
      });
    });

    describe('when role granting is not delayed', function () {
      beforeEach('define delay', function () {
        this.grantDelay = 0n;
      });

      describe('when caller has an execution delay', function () {
        beforeEach('set role and delay', async function () {
          this.executionDelay = time.duration.hours(10);
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        case5();
      });

      describe('when caller has no execution delay', function () {
        beforeEach('set role and delay', async function () {
          this.executionDelay = 0n;
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        case6();
      });
    });
  });

  describe('when role is not granted', function () {
    // Because this helper can be composed with other helpers, it's possible
    // that role has been set already by another helper.
    // Although this is highly unlikely, we check for it here to avoid false positives.
    beforeEach('assert role is unset', async function () {
      const { since } = await this.manager.getAccess(this.role.id, this.caller);
      expect(since).to.equal(0n);
    });

    requiredRoleIsNotGranted();
  });
}

module.exports = {
  LIKE_COMMON_IS_EXECUTING,
  LIKE_COMMON_GET_ACCESS,
  LIKE_COMMON_SCHEDULABLE,
  testAsClosable,
  testAsDelay,
  testAsSchedulableOperation,
  testAsRestrictedOperation,
  testAsDelayedOperation,
  testAsCanCall,
  testAsHasRole,
  testAsGetAccess,
};
