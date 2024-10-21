const { expect } = require('chai');

const {
  LIKE_COMMON_IS_EXECUTING,
  LIKE_COMMON_GET_ACCESS,
  LIKE_COMMON_SCHEDULABLE,
  testAsSchedulableOperation,
  testAsRestrictedOperation,
  testAsDelayedOperation,
  testAsCanCall,
  testAsHasRole,
} = require('./AccessManager.predicate');

// ============ ADMIN OPERATION ============

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeDelayedAdminOperation() {
  const getAccessPath = LIKE_COMMON_GET_ACCESS;
  testAsDelayedOperation.mineDelay = true;
  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay =
    testAsDelayedOperation;
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = function () {
    beforeEach('set execution delay', async function () {
      this.scheduleIn = this.executionDelay; // For testAsDelayedOperation
    });
    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  };

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  testAsRestrictedOperation({
    callerIsTheManager: LIKE_COMMON_IS_EXECUTING,
    callerIsNotTheManager() {
      testAsHasRole({
        publicRoleIsRequired() {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
              .to.be.revertedWithCustomError(this.target, 'AccessManagerUnauthorizedAccount')
              .withArgs(
                this.caller,
                this.roles.ADMIN.id, // Although PUBLIC is required, target function role doesn't apply to admin ops
              );
          });
        },
        specificRoleIsRequired: getAccessPath,
      });
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeNotDelayedAdminOperation() {
  const getAccessPath = LIKE_COMMON_GET_ACCESS;

  function testScheduleOperation(mineDelay) {
    return function self() {
      self.mineDelay = mineDelay;
      beforeEach('set execution delay', async function () {
        this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
      });
      testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
    };
  }

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay =
    testScheduleOperation(true);
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = testScheduleOperation(false);

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  testAsRestrictedOperation({
    callerIsTheManager: LIKE_COMMON_IS_EXECUTING,
    callerIsNotTheManager() {
      testAsHasRole({
        publicRoleIsRequired() {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
              .to.be.revertedWithCustomError(this.target, 'AccessManagerUnauthorizedAccount')
              .withArgs(
                this.caller,
                this.roles.ADMIN.id, // Although PUBLIC_ROLE is required, admin ops are not subject to target function roles
              );
          });
        },
        specificRoleIsRequired: getAccessPath,
      });
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeRoleAdminOperation(roleAdmin) {
  const getAccessPath = LIKE_COMMON_GET_ACCESS;

  function afterGrantDelay() {
    afterGrantDelay.mineDelay = true;
    beforeEach('set execution delay', async function () {
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
    });
    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  }

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay = afterGrantDelay;
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = afterGrantDelay;

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  testAsRestrictedOperation({
    callerIsTheManager: LIKE_COMMON_IS_EXECUTING,
    callerIsNotTheManager() {
      testAsHasRole({
        publicRoleIsRequired() {
          it('reverts as AccessManagerUnauthorizedAccount', async function () {
            await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
              .to.be.revertedWithCustomError(this.target, 'AccessManagerUnauthorizedAccount')
              .withArgs(this.caller, roleAdmin);
          });
        },
        specificRoleIsRequired: getAccessPath,
      });
    },
  });
}

// ============ RESTRICTED OPERATION ============

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeAManagedRestrictedOperation() {
  function revertUnauthorized() {
    it('reverts as AccessManagedUnauthorized', async function () {
      await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
        .to.be.revertedWithCustomError(this.target, 'AccessManagedUnauthorized')
        .withArgs(this.caller);
    });
  }

  const getAccessPath = LIKE_COMMON_GET_ACCESS;

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.beforeGrantDelay =
    revertUnauthorized;
  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasNoExecutionDelay.beforeGrantDelay =
    revertUnauthorized;
  getAccessPath.requiredRoleIsNotGranted = revertUnauthorized;

  function testScheduleOperation(mineDelay) {
    return function self() {
      self.mineDelay = mineDelay;
      beforeEach('sets execution delay', async function () {
        this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
      });
      testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
    };
  }

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay =
    testScheduleOperation(true);
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = testScheduleOperation(false);

  const isExecutingPath = LIKE_COMMON_IS_EXECUTING;
  isExecutingPath.notExecuting = revertUnauthorized;

  testAsCanCall({
    closed: revertUnauthorized,
    open: {
      callerIsTheManager: isExecutingPath,
      callerIsNotTheManager: {
        publicRoleIsRequired() {
          it('succeeds called directly', async function () {
            await this.caller.sendTransaction({ to: this.target, data: this.calldata });
          });

          it('succeeds via execute', async function () {
            await this.manager.connect(this.caller).execute(this.target, this.calldata);
          });
        },
        specificRoleIsRequired: getAccessPath,
      },
    },
  });
}

/**
 * @requires this.{target,manager,roles,calldata,role}
 */
function shouldBehaveLikeASelfRestrictedOperation() {
  function revertUnauthorized() {
    it('reverts as AccessManagerUnauthorizedAccount', async function () {
      await expect(this.caller.sendTransaction({ to: this.target, data: this.calldata }))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedAccount')
        .withArgs(this.caller, this.role?.id ?? 0n);
    });
  }

  const getAccessPath = LIKE_COMMON_GET_ACCESS;

  function testScheduleOperation(mineDelay) {
    return function self() {
      self.mineDelay = mineDelay;
      beforeEach('sets execution delay', async function () {
        this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
      });
      testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
    };
  }

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay =
    testScheduleOperation(true);
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = testScheduleOperation(false);

  beforeEach('set target as manager', function () {
    this.target = this.manager;
  });

  const isExecutingPath = LIKE_COMMON_IS_EXECUTING;
  isExecutingPath.notExecuting = revertUnauthorized;

  testAsCanCall({
    closed: revertUnauthorized,
    open: {
      callerIsTheManager: isExecutingPath,
      callerIsNotTheManager: {
        publicRoleIsRequired() {
          it('succeeds called directly', async function () {
            await this.caller.sendTransaction({ to: this.target, data: this.calldata });
          });

          it('succeeds via execute', async function () {
            await this.manager.connect(this.caller).execute(this.target, this.calldata);
          });
        },
        specificRoleIsRequired: getAccessPath,
      },
    },
  });
}

module.exports = {
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeNotDelayedAdminOperation,
  shouldBehaveLikeRoleAdminOperation,
  shouldBehaveLikeAManagedRestrictedOperation,
  shouldBehaveLikeASelfRestrictedOperation,
};
