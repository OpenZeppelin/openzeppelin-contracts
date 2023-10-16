const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
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
  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay = function () {
    beforeEach('consume previously set grant delay', async function () {
      // Consume previously set delay
      await mine();
    });
    testAsDelayedOperation();
  };
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
            await expectRevertCustomError(
              web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
              'AccessManagerUnauthorizedAccount',
              [
                this.caller,
                this.roles.ADMIN.id, // Although PUBLIC is required, target function role doesn't apply to admin ops
              ],
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
  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay = function () {
    beforeEach('set execution delay', async function () {
      await mine();
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
    });
    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  };
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = function () {
    beforeEach('set execution delay', async function () {
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
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
            await expectRevertCustomError(
              web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
              'AccessManagerUnauthorizedAccount',
              [this.caller, this.roles.ADMIN.id], // Although PUBLIC_ROLE is required, admin ops are not subject to target function roles
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
  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay = function () {
    beforeEach('set operation delay', async function () {
      await mine();
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
    });
    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  };
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = function () {
    beforeEach('set execution delay', async function () {
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
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
            await expectRevertCustomError(
              web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
              'AccessManagerUnauthorizedAccount',
              [this.caller, roleAdmin], // Role admin ops require the role's admin
            );
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
      await expectRevertCustomError(
        web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
        'AccessManagedUnauthorized',
        [this.caller],
      );
    });
  }

  const getAccessPath = LIKE_COMMON_GET_ACCESS;

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.beforeGrantDelay =
    revertUnauthorized;
  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasNoExecutionDelay.beforeGrantDelay =
    revertUnauthorized;
  getAccessPath.requiredRoleIsNotGranted = revertUnauthorized;

  getAccessPath.requiredRoleIsGranted.roleGrantingIsDelayed.callerHasAnExecutionDelay.afterGrantDelay = function () {
    beforeEach('consume previously set grant delay', async function () {
      // Consume previously set delay
      await mine();
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
    });
    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  };
  getAccessPath.requiredRoleIsGranted.roleGrantingIsNotDelayed.callerHasAnExecutionDelay = function () {
    beforeEach('consume previously set grant delay', async function () {
      this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
    });
    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
  };

  const isExecutingPath = LIKE_COMMON_IS_EXECUTING;
  isExecutingPath.notExecuting = revertUnauthorized;

  testAsCanCall({
    closed: revertUnauthorized,
    open: {
      callerIsTheManager: isExecutingPath,
      callerIsNotTheManager: {
        publicRoleIsRequired() {
          it('succeeds called directly', async function () {
            await web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller });
          });

          it('succeeds via execute', async function () {
            await this.manager.execute(this.target.address, this.calldata, { from: this.caller });
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
};
