const { expect } = require('chai');

const { selector } = require('../../helpers/methods');
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
                this.roles.ADMIN.id, // Although PUBLIC_ROLE is required, target function role doesn't apply to admin ops
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

// ============ ENUMERABLE EXTENSION ============

/**
 * @requires this.{manager,roles,admin,user,other}
 */
function shouldBehaveLikeAccessManagerEnumerable() {
  describe('enumerating', function () {
    const ANOTHER_ROLE = 0xdeadc0de2n;

    describe('role members', function () {
      it('role bearers can be enumerated', async function () {
        // Grant roles to multiple accounts
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.user, 0);
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.other, 0);
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.admin, 0);

        // Revoke one role
        await this.manager.connect(this.admin).revokeRole(ANOTHER_ROLE, this.other);

        const expectedMembers = [this.user.address, this.admin.address];

        // Test individual enumeration
        const memberCount = await this.manager.getRoleMemberCount(ANOTHER_ROLE);
        const members = [];
        for (let i = 0; i < memberCount; ++i) {
          members.push(await this.manager.getRoleMember(ANOTHER_ROLE, i));
        }

        expect(memberCount).to.equal(expectedMembers.length);
        expect(members).to.deep.equal(expectedMembers);

        // Test batch enumeration
        await expect(this.manager.getRoleMembers(ANOTHER_ROLE, 0, memberCount)).to.eventually.deep.equal(
          expectedMembers,
        );
      });

      it('role enumeration should be in sync after renounceRole call', async function () {
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.user, 0);

        await expect(this.manager.getRoleMemberCount(ANOTHER_ROLE)).to.eventually.equal(1); // Only the initial member
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.admin, 0);
        await expect(this.manager.getRoleMemberCount(ANOTHER_ROLE)).to.eventually.equal(2);
        await this.manager.connect(this.admin).renounceRole(ANOTHER_ROLE, this.admin);
        await expect(this.manager.getRoleMemberCount(ANOTHER_ROLE)).to.eventually.equal(1);
      });

      it('returns empty for roles with no members', async function () {
        const roleId = 999n; // Non-existent role

        await expect(this.manager.getRoleMemberCount(roleId)).to.eventually.equal(0);
        await expect(this.manager.getRoleMembers(roleId, 0, 10)).to.eventually.deep.equal([]);
      });

      it('supports partial enumeration with start and end parameters', async function () {
        // Grant roles to multiple accounts
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.user, 0);
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.other, 0);
        await this.manager.connect(this.admin).grantRole(ANOTHER_ROLE, this.admin, 0);

        await expect(this.manager.getRoleMemberCount(ANOTHER_ROLE)).to.eventually.equal(3);

        const users = [this.user.address, this.other.address, this.admin.address];

        // Test partial enumeration
        const firstTwo = await this.manager.getRoleMembers(ANOTHER_ROLE, 0, 2);
        expect(firstTwo).to.have.lengthOf(2);
        expect(users).to.include.members(firstTwo);

        const lastTwo = await this.manager.getRoleMembers(ANOTHER_ROLE, 1, 3);
        expect(lastTwo).to.have.lengthOf(2);
        expect(users).to.include.members(lastTwo);
      });
    });

    describe('target functions', function () {
      it('target functions can be enumerated', async function () {
        const roleId = this.roles.SOME.id;
        const selectors = [
          selector('someFunction()'),
          selector('anotherFunction(uint256)'),
          selector('thirdFunction(address,bool)'),
        ];

        await this.manager.connect(this.admin).setTargetFunctionRole(this.manager, selectors, roleId);

        const functionCount = await this.manager.getRoleTargetFunctionCount(roleId);
        expect(functionCount).to.equal(selectors.length);

        // Test individual enumeration
        const functions = [];
        for (let i = 0; i < functionCount; ++i) {
          functions.push(this.manager.getRoleTargetFunction(roleId, i));
        }
        await expect(Promise.all(functions)).to.eventually.have.members(selectors);

        // Test batch enumeration
        const batchFunctions = await this.manager.getRoleTargetFunctions(roleId, 0, functionCount);
        expect([...batchFunctions]).to.have.members(selectors);
      });

      it('target function enumeration updates when roles change', async function () {
        const roleId1 = this.roles.SOME.id;
        const roleId2 = this.roles.SOME_ADMIN.id;
        const sel = selector('testFunction()');

        // Initially assign to roleId1
        await this.manager.connect(this.admin).setTargetFunctionRole(this.manager, [sel], roleId1);

        await expect(this.manager.getRoleTargetFunctionCount(roleId1)).to.eventually.equal(1);
        await expect(this.manager.getRoleTargetFunctionCount(roleId2)).to.eventually.equal(0);
        await expect(this.manager.getRoleTargetFunction(roleId1, 0)).to.eventually.equal(sel);

        // Reassign to roleId2
        await this.manager.connect(this.admin).setTargetFunctionRole(this.manager, [sel], roleId2);

        await expect(this.manager.getRoleTargetFunctionCount(roleId1)).to.eventually.equal(0);
        await expect(this.manager.getRoleTargetFunctionCount(roleId2)).to.eventually.equal(1);
        await expect(this.manager.getRoleTargetFunction(roleId2, 0)).to.eventually.equal(sel);
      });

      it('returns empty for ADMIN_ROLE target functions', async function () {
        const sel = selector('adminFunction()');

        // Set function to ADMIN_ROLE (default behavior)
        await this.manager.connect(this.admin).setTargetFunctionRole(this.manager, [sel], this.roles.ADMIN.id);

        // ADMIN_ROLE functions are not tracked
        await expect(this.manager.getRoleTargetFunctionCount(this.roles.ADMIN.id)).to.eventually.equal(0);
        await expect(this.manager.getRoleTargetFunctions(this.roles.ADMIN.id, 0, 10)).to.eventually.deep.equal([]);
      });

      it('returns empty for roles with no target functions', async function () {
        const roleId = 888n; // Role with no functions

        await expect(this.manager.getRoleTargetFunctionCount(roleId)).to.eventually.equal(0);
        await expect(this.manager.getRoleTargetFunctions(roleId, 0, 10)).to.eventually.deep.equal([]);
      });

      it('supports partial enumeration of target functions', async function () {
        const roleId = this.roles.SOME.id;
        const selectors = [selector('func1()'), selector('func2()'), selector('func3()'), selector('func4()')];

        await this.manager.connect(this.admin).setTargetFunctionRole(this.manager, selectors, roleId);

        await expect(this.manager.getRoleTargetFunctionCount(roleId)).to.eventually.equal(4);

        // Test partial enumeration
        const firstTwo = await this.manager.getRoleTargetFunctions(roleId, 0, 2);
        expect(firstTwo).to.have.lengthOf(2);

        const lastTwo = await this.manager.getRoleTargetFunctions(roleId, 2, 4);
        expect(lastTwo).to.have.lengthOf(2);

        // Verify no overlap and complete coverage
        const allFunctions = [...firstTwo, ...lastTwo];
        expect(allFunctions).to.have.members(selectors);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeNotDelayedAdminOperation,
  shouldBehaveLikeRoleAdminOperation,
  shouldBehaveLikeAManagedRestrictedOperation,
  shouldBehaveLikeASelfRestrictedOperation,
  shouldBehaveLikeAccessManagerEnumerable,
};
