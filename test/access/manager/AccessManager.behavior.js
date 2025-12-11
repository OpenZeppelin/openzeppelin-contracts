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
  testAsClosable,
  testAsDelay,
  testAsGetAccess,
} = require('./AccessManager.predicate');
const {
  formatAccess,
  EXPIRATION,
  MINSETBACK,
  EXECUTION_ID_STORAGE_SLOT,
  CONSUMING_SCHEDULE_STORAGE_SLOT,
  prepareOperation,
  hashOperation,
} = require('../../helpers/access-manager');
const { impersonate } = require('../../helpers/account');
const { MAX_UINT48 } = require('../../helpers/constants');
const { ethers } = require('hardhat');
const time = require('../../helpers/time');

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

// ============ ACCESS MANAGER ============

/**
 * This test suite is made using the following tools:
 *
 * * Predicates: Functions with common conditional setups without assertions.
 * * Behaviors: Functions with common assertions.
 *
 * The behavioral tests are built by composing predicates and are used as templates
 * for testing access to restricted functions.
 *
 * Similarly, unit tests in this suite will use predicates to test subsets of these
 * behaviors and are helped by common assertions provided for some of the predicates.
 *
 * The predicates can be identified by the `testAs*` prefix while the behaviors
 * are prefixed with `shouldBehave*`. The common assertions for predicates are
 * defined as constants.
 *
 * @requires this.{admin,roleAdmin,user,other,roles,manager,target}
 */
function shouldBehaveLikeAccessManager() {
  describe('during construction', function () {
    it('grants admin role to initialAdmin', async function () {
      const manager = await ethers.deployContract('$AccessManager', [this.other]);
      await expect(manager.hasRole(this.roles.ADMIN.id, this.other).then(formatAccess)).to.eventually.be.deep.equal([
        true,
        '0',
      ]);
    });

    it('rejects zero address for initialAdmin', async function () {
      await expect(ethers.deployContract('$AccessManager', [ethers.ZeroAddress]))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerInvalidInitialAdmin')
        .withArgs(ethers.ZeroAddress);
    });

    it('initializes setup roles correctly', async function () {
      for (const { id: roleId, admin, guardian, members } of Object.values(this.roles)) {
        await expect(this.manager.getRoleAdmin(roleId)).to.eventually.equal(admin.id);
        await expect(this.manager.getRoleGuardian(roleId)).to.eventually.equal(guardian.id);

        for (const user of this.roles.PUBLIC.members) {
          await expect(this.manager.hasRole(roleId, user).then(formatAccess)).to.eventually.be.deep.equal([
            members.includes(user),
            '0',
          ]);
        }
      }
    });
  });

  describe('getters', function () {
    describe('#canCall', function () {
      beforeEach('set calldata', function () {
        this.calldata = '0x12345678';
        this.role = { id: 379204n };
      });

      testAsCanCall({
        closed() {
          it('should return false and no delay', async function () {
            const { immediate, delay } = await this.manager.canCall(
              this.other,
              this.target,
              this.calldata.substring(0, 10),
            );
            expect(immediate).to.be.false;
            expect(delay).to.equal(0n);
          });
        },
        open: {
          callerIsTheManager: {
            executing() {
              it('should return true and no delay', async function () {
                const { immediate, delay } = await this.manager.canCall(
                  this.caller,
                  this.target,
                  this.calldata.substring(0, 10),
                );
                expect(immediate).to.be.true;
                expect(delay).to.equal(0n);
              });
            },
            notExecuting() {
              it('should return false and no delay', async function () {
                const { immediate, delay } = await this.manager.canCall(
                  this.caller,
                  this.target,
                  this.calldata.substring(0, 10),
                );
                expect(immediate).to.be.false;
                expect(delay).to.equal(0n);
              });
            },
          },
          callerIsNotTheManager: {
            publicRoleIsRequired() {
              it('should return true and no delay', async function () {
                const { immediate, delay } = await this.manager.canCall(
                  this.caller,
                  this.target,
                  this.calldata.substring(0, 10),
                );
                expect(immediate).to.be.true;
                expect(delay).to.equal(0n);
              });
            },
            specificRoleIsRequired: {
              requiredRoleIsGranted: {
                roleGrantingIsDelayed: {
                  callerHasAnExecutionDelay: {
                    beforeGrantDelay: function self() {
                      self.mineDelay = true;

                      it('should return false and no execution delay', async function () {
                        const { immediate, delay } = await this.manager.canCall(
                          this.caller,
                          this.target,
                          this.calldata.substring(0, 10),
                        );
                        expect(immediate).to.be.false;
                        expect(delay).to.equal(0n);
                      });
                    },
                    afterGrantDelay: function self() {
                      self.mineDelay = true;

                      beforeEach('sets execution delay', function () {
                        this.scheduleIn = this.executionDelay; // For testAsSchedulableOperation
                      });

                      testAsSchedulableOperation({
                        scheduled: {
                          before: function self() {
                            self.mineDelay = true;

                            it('should return false and execution delay', async function () {
                              const { immediate, delay } = await this.manager.canCall(
                                this.caller,
                                this.target,
                                this.calldata.substring(0, 10),
                              );
                              expect(immediate).to.be.false;
                              expect(delay).to.equal(this.executionDelay);
                            });
                          },
                          after: function self() {
                            self.mineDelay = true;

                            it('should return false and execution delay', async function () {
                              const { immediate, delay } = await this.manager.canCall(
                                this.caller,
                                this.target,
                                this.calldata.substring(0, 10),
                              );
                              expect(immediate).to.be.false;
                              expect(delay).to.equal(this.executionDelay);
                            });
                          },
                          expired: function self() {
                            self.mineDelay = true;

                            it('should return false and execution delay', async function () {
                              const { immediate, delay } = await this.manager.canCall(
                                this.caller,
                                this.target,
                                this.calldata.substring(0, 10),
                              );
                              expect(immediate).to.be.false;
                              expect(delay).to.equal(this.executionDelay);
                            });
                          },
                        },
                        notScheduled() {
                          it('should return false and execution delay', async function () {
                            const { immediate, delay } = await this.manager.canCall(
                              this.caller,
                              this.target,
                              this.calldata.substring(0, 10),
                            );
                            expect(immediate).to.be.false;
                            expect(delay).to.equal(this.executionDelay);
                          });
                        },
                      });
                    },
                  },
                  callerHasNoExecutionDelay: {
                    beforeGrantDelay: function self() {
                      self.mineDelay = true;

                      it('should return false and no execution delay', async function () {
                        const { immediate, delay } = await this.manager.canCall(
                          this.caller,
                          this.target,
                          this.calldata.substring(0, 10),
                        );
                        expect(immediate).to.be.false;
                        expect(delay).to.equal(0n);
                      });
                    },
                    afterGrantDelay: function self() {
                      self.mineDelay = true;

                      it('should return true and no execution delay', async function () {
                        const { immediate, delay } = await this.manager.canCall(
                          this.caller,
                          this.target,
                          this.calldata.substring(0, 10),
                        );
                        expect(immediate).to.be.true;
                        expect(delay).to.equal(0n);
                      });
                    },
                  },
                },
                roleGrantingIsNotDelayed: {
                  callerHasAnExecutionDelay() {
                    it('should return false and execution delay', async function () {
                      const { immediate, delay } = await this.manager.canCall(
                        this.caller,
                        this.target,
                        this.calldata.substring(0, 10),
                      );
                      expect(immediate).to.be.false;
                      expect(delay).to.equal(this.executionDelay);
                    });
                  },
                  callerHasNoExecutionDelay() {
                    it('should return true and no execution delay', async function () {
                      const { immediate, delay } = await this.manager.canCall(
                        this.caller,
                        this.target,
                        this.calldata.substring(0, 10),
                      );
                      expect(immediate).to.be.true;
                      expect(delay).to.equal(0n);
                    });
                  },
                },
              },
              requiredRoleIsNotGranted() {
                it('should return false and no execution delay', async function () {
                  const { immediate, delay } = await this.manager.canCall(
                    this.caller,
                    this.target,
                    this.calldata.substring(0, 10),
                  );
                  expect(immediate).to.be.false;
                  expect(delay).to.equal(0n);
                });
              },
            },
          },
        },
      });
    });

    describe('#expiration', function () {
      it('has a 7 days default expiration', async function () {
        await expect(this.manager.expiration()).to.eventually.equal(EXPIRATION);
      });
    });

    describe('#minSetback', function () {
      it('has a 5 days default minimum setback', async function () {
        await expect(this.manager.minSetback()).to.eventually.equal(MINSETBACK);
      });
    });

    describe('#isTargetClosed', function () {
      testAsClosable({
        closed() {
          it('returns true', async function () {
            await expect(this.manager.isTargetClosed(this.target)).to.eventually.be.true;
          });
        },
        open() {
          it('returns false', async function () {
            await expect(this.manager.isTargetClosed(this.target)).to.eventually.be.false;
          });
        },
      });
    });

    describe('#getTargetFunctionRole', function () {
      const methodSelector = selector('something(address,bytes)');

      it('returns the target function role', async function () {
        const roleId = 21498n;
        await this.manager.$_setTargetFunctionRole(this.target, methodSelector, roleId);

        await expect(this.manager.getTargetFunctionRole(this.target, methodSelector)).to.eventually.equal(roleId);
      });

      it('returns the ADMIN role if not set', async function () {
        await expect(this.manager.getTargetFunctionRole(this.target, methodSelector)).to.eventually.equal(
          this.roles.ADMIN.id,
        );
      });
    });

    describe('#getTargetAdminDelay', function () {
      describe('when the target admin delay is setup', function () {
        beforeEach('set target admin delay', async function () {
          this.oldDelay = await this.manager.getTargetAdminDelay(this.target);
          this.newDelay = time.duration.days(10);

          await this.manager.$_setTargetAdminDelay(this.target, this.newDelay);
          this.delay = MINSETBACK; // For testAsDelay
        });

        testAsDelay('effect', {
          before: function self() {
            self.mineDelay = true;

            it('returns the old target admin delay', async function () {
              await expect(this.manager.getTargetAdminDelay(this.target)).to.eventually.equal(this.oldDelay);
            });
          },
          after: function self() {
            self.mineDelay = true;

            it('returns the new target admin delay', async function () {
              await expect(this.manager.getTargetAdminDelay(this.target)).to.eventually.equal(this.newDelay);
            });
          },
        });
      });

      it('returns the 0 if not set', async function () {
        await expect(this.manager.getTargetAdminDelay(this.target)).to.eventually.equal(0n);
      });
    });

    describe('#getRoleAdmin', function () {
      const roleId = 5234907n;

      it('returns the role admin', async function () {
        const adminId = 789433n;

        await this.manager.$_setRoleAdmin(roleId, adminId);

        await expect(this.manager.getRoleAdmin(roleId)).to.eventually.equal(adminId);
      });

      it('returns the ADMIN role if not set', async function () {
        await expect(this.manager.getRoleAdmin(roleId)).to.eventually.equal(this.roles.ADMIN.id);
      });
    });

    describe('#getRoleGuardian', function () {
      const roleId = 5234907n;

      it('returns the role guardian', async function () {
        const guardianId = 789433n;

        await this.manager.$_setRoleGuardian(roleId, guardianId);

        await expect(this.manager.getRoleGuardian(roleId)).to.eventually.equal(guardianId);
      });

      it('returns the ADMIN role if not set', async function () {
        await expect(this.manager.getRoleGuardian(roleId)).to.eventually.equal(this.roles.ADMIN.id);
      });
    });

    describe('#getRoleGrantDelay', function () {
      const roleId = 9248439n;

      describe('when the grant admin delay is setup', function () {
        beforeEach('set grant admin delay', async function () {
          this.oldDelay = await this.manager.getRoleGrantDelay(roleId);
          this.newDelay = time.duration.days(11);

          await this.manager.$_setGrantDelay(roleId, this.newDelay);
          this.delay = MINSETBACK; // For testAsDelay
        });

        testAsDelay('grant', {
          before: function self() {
            self.mineDelay = true;

            it('returns the old role grant delay', async function () {
              await expect(this.manager.getRoleGrantDelay(roleId)).to.eventually.equal(this.oldDelay);
            });
          },
          after: function self() {
            self.mineDelay = true;

            it('returns the new role grant delay', async function () {
              await expect(this.manager.getRoleGrantDelay(roleId)).to.eventually.equal(this.newDelay);
            });
          },
        });
      });

      it('returns 0 if delay is not set', async function () {
        await expect(this.manager.getTargetAdminDelay(this.target)).to.eventually.equal(0n);
      });
    });

    describe('#getAccess', function () {
      beforeEach('set role', function () {
        this.role = { id: 9452n };
        this.caller = this.user;
      });

      testAsGetAccess({
        requiredRoleIsGranted: {
          roleGrantingIsDelayed: {
            callerHasAnExecutionDelay: {
              beforeGrantDelay: function self() {
                self.mineDelay = true;

                it('role is not in effect and execution delay is set', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);
                  expect(access[0]).to.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.equal(this.executionDelay); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // pendingDelayEffect

                  // Not in effect yet
                  await expect(time.clock.timestamp()).to.eventually.be.below(access[0]);
                });
              },
              afterGrantDelay: function self() {
                self.mineDelay = true;

                it('access has role in effect and execution delay is set', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);

                  expect(access[0]).to.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.equal(this.executionDelay); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // pendingDelayEffect

                  // Already in effect
                  await expect(time.clock.timestamp()).to.eventually.equal(access[0]);
                });
              },
            },
            callerHasNoExecutionDelay: {
              beforeGrantDelay: function self() {
                self.mineDelay = true;

                it('access has role not in effect without execution delay', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);
                  expect(access[0]).to.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.equal(0n); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // pendingDelayEffect

                  // Not in effect yet
                  await expect(time.clock.timestamp()).to.eventually.be.below(access[0]);
                });
              },
              afterGrantDelay: function self() {
                self.mineDelay = true;

                it('role is in effect without execution delay', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);
                  expect(access[0]).to.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.equal(0n); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // pendingDelayEffect

                  // Already in effect
                  await expect(time.clock.timestamp()).to.eventually.equal(access[0]);
                });
              },
            },
          },
          roleGrantingIsNotDelayed: {
            callerHasAnExecutionDelay() {
              it('access has role in effect and execution delay is set', async function () {
                const access = await this.manager.getAccess(this.role.id, this.caller);
                expect(access[0]).to.equal(await time.clock.timestamp()); // inEffectSince
                expect(access[1]).to.equal(this.executionDelay); // currentDelay
                expect(access[2]).to.equal(0n); // pendingDelay
                expect(access[3]).to.equal(0n); // pendingDelayEffect

                // Already in effect
                await expect(time.clock.timestamp()).to.eventually.equal(access[0]);
              });
            },
            callerHasNoExecutionDelay() {
              it('access has role in effect without execution delay', async function () {
                const access = await this.manager.getAccess(this.role.id, this.caller);
                expect(access[0]).to.equal(await time.clock.timestamp()); // inEffectSince
                expect(access[1]).to.equal(0n); // currentDelay
                expect(access[2]).to.equal(0n); // pendingDelay
                expect(access[3]).to.equal(0n); // pendingDelayEffect

                // Already in effect
                await expect(time.clock.timestamp()).to.eventually.equal(access[0]);
              });
            },
          },
        },
        requiredRoleIsNotGranted() {
          it('has empty access', async function () {
            const access = await this.manager.getAccess(this.role.id, this.caller);
            expect(access[0]).to.equal(0n); // inEffectSince
            expect(access[1]).to.equal(0n); // currentDelay
            expect(access[2]).to.equal(0n); // pendingDelay
            expect(access[3]).to.equal(0n); // pendingDelayEffect
          });
        },
      });
    });

    describe('#hasRole', function () {
      beforeEach('setup testAsHasRole', function () {
        this.role = { id: 49832n };
        this.calldata = '0x12345678';
        this.caller = this.user;
      });

      testAsHasRole({
        publicRoleIsRequired() {
          it('has PUBLIC role', async function () {
            const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
            expect(isMember).to.be.true;
            expect(executionDelay).to.equal('0');
          });
        },
        specificRoleIsRequired: {
          requiredRoleIsGranted: {
            roleGrantingIsDelayed: {
              callerHasAnExecutionDelay: {
                beforeGrantDelay: function self() {
                  self.mineDelay = true;

                  it('does not have role but execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.false;
                    expect(executionDelay).to.equal(this.executionDelay);
                  });
                },
                afterGrantDelay: function self() {
                  self.mineDelay = true;

                  it('has role and execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.true;
                    expect(executionDelay).to.equal(this.executionDelay);
                  });
                },
              },
              callerHasNoExecutionDelay: {
                beforeGrantDelay: function self() {
                  self.mineDelay = true;

                  it('does not have role nor execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.false;
                    expect(executionDelay).to.equal('0');
                  });
                },
                afterGrantDelay: function self() {
                  self.mineDelay = true;

                  it('has role and no execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.true;
                    expect(executionDelay).to.equal('0');
                  });
                },
              },
            },
            roleGrantingIsNotDelayed: {
              callerHasAnExecutionDelay() {
                it('has role and execution delay', async function () {
                  const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                  expect(isMember).to.be.true;
                  expect(executionDelay).to.equal(this.executionDelay);
                });
              },
              callerHasNoExecutionDelay() {
                it('has role and no execution delay', async function () {
                  const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                  expect(isMember).to.be.true;
                  expect(executionDelay).to.equal('0');
                });
              },
            },
          },
          requiredRoleIsNotGranted() {
            it('has no role and no execution delay', async function () {
              const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
              expect(isMember).to.be.false;
              expect(executionDelay).to.equal('0');
            });
          },
        },
      });
    });

    describe('#getSchedule', function () {
      beforeEach('set role and calldata', async function () {
        const fnRestricted = this.target.fnRestricted.getFragment().selector;
        this.caller = this.user;
        this.role = { id: 493590n };
        await this.manager.$_setTargetFunctionRole(this.target, fnRestricted, this.role.id);
        await this.manager.$_grantRole(this.role.id, this.caller, 0, 1); // nonzero execution delay

        this.calldata = this.target.interface.encodeFunctionData(fnRestricted, []);
        this.scheduleIn = time.duration.days(10); // For testAsSchedulableOperation
      });

      testAsSchedulableOperation({
        scheduled: {
          before: function self() {
            self.mineDelay = true;

            it('returns schedule in the future', async function () {
              const schedule = await this.manager.getSchedule(this.operationId);
              expect(schedule).to.equal(this.scheduledAt + this.scheduleIn);
              expect(schedule).to.gt(await time.clock.timestamp());
            });
          },
          after: function self() {
            self.mineDelay = true;

            it('returns schedule', async function () {
              const schedule = await this.manager.getSchedule(this.operationId);
              expect(schedule).to.equal(this.scheduledAt + this.scheduleIn);
              expect(schedule).to.equal(await time.clock.timestamp());
            });
          },
          expired: function self() {
            self.mineDelay = true;

            it('returns 0', async function () {
              await expect(this.manager.getSchedule(this.operationId)).to.eventually.equal(0n);
            });
          },
        },
        notScheduled() {
          it('defaults to 0', async function () {
            await expect(this.manager.getSchedule(this.operationId)).to.eventually.equal(0n);
          });
        },
      });
    });

    describe('#getNonce', function () {
      describe('when operation is scheduled', function () {
        beforeEach('schedule operation', async function () {
          const fnRestricted = this.target.fnRestricted.getFragment().selector;
          this.caller = this.user;
          this.role = { id: 4209043n };
          await this.manager.$_setTargetFunctionRole(this.target, fnRestricted, this.role.id);
          await this.manager.$_grantRole(this.role.id, this.caller, 0, 1); // nonzero execution delay

          this.calldata = this.target.interface.encodeFunctionData(fnRestricted, []);
          this.delay = time.duration.days(10);

          const { operationId, schedule } = await prepareOperation(this.manager, {
            caller: this.caller,
            target: this.target,
            calldata: this.calldata,
            delay: this.delay,
          });
          await schedule();
          this.operationId = operationId;
        });

        it('returns nonce', async function () {
          await expect(this.manager.getNonce(this.operationId)).to.eventually.equal(1n);
        });
      });

      describe('when is not scheduled', function () {
        it('returns default 0', async function () {
          await expect(this.manager.getNonce(ethers.id('operation'))).to.eventually.equal(0n);
        });
      });
    });

    describe('#hashOperation', function () {
      it('returns an operationId', async function () {
        const args = [this.user, this.other, '0x123543'];
        await expect(this.manager.hashOperation(...args)).to.eventually.equal(hashOperation(...args));
      });
    });
  });

  describe('admin operations', function () {
    beforeEach('set required role', function () {
      this.role = this.roles.ADMIN;
    });

    describe('subject to a delay', function () {
      describe('#labelRole', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [123443, 'TEST'];
            const method = this.manager.interface.getFunction('labelRole(uint64,string)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it('emits an event with the label', async function () {
          await expect(this.manager.connect(this.admin).labelRole(this.roles.SOME.id, 'Some label'))
            .to.emit(this.manager, 'RoleLabel')
            .withArgs(this.roles.SOME.id, 'Some label');
        });

        it('updates label on a second call', async function () {
          await this.manager.connect(this.admin).labelRole(this.roles.SOME.id, 'Some label');

          await expect(this.manager.connect(this.admin).labelRole(this.roles.SOME.id, 'Updated label'))
            .to.emit(this.manager, 'RoleLabel')
            .withArgs(this.roles.SOME.id, 'Updated label');
        });

        it('reverts labeling PUBLIC_ROLE', async function () {
          await expect(this.manager.connect(this.admin).labelRole(this.roles.PUBLIC.id, 'Some label'))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.PUBLIC.id);
        });

        it('reverts labeling ADMIN_ROLE', async function () {
          await expect(this.manager.connect(this.admin).labelRole(this.roles.ADMIN.id, 'Some label'))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.ADMIN.id);
        });
      });

      describe('#setRoleAdmin', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [93445, 84532];
            const method = this.manager.interface.getFunction('setRoleAdmin(uint64,uint64)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it("sets any role's admin if called by an admin", async function () {
          await expect(this.manager.getRoleAdmin(this.roles.SOME.id)).to.eventually.equal(this.roles.SOME_ADMIN.id);

          await expect(this.manager.connect(this.admin).setRoleAdmin(this.roles.SOME.id, this.roles.ADMIN.id))
            .to.emit(this.manager, 'RoleAdminChanged')
            .withArgs(this.roles.SOME.id, this.roles.ADMIN.id);

          await expect(this.manager.getRoleAdmin(this.roles.SOME.id)).to.eventually.equal(this.roles.ADMIN.id);
        });

        it('reverts setting PUBLIC_ROLE admin', async function () {
          await expect(this.manager.connect(this.admin).setRoleAdmin(this.roles.PUBLIC.id, this.roles.ADMIN.id))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.PUBLIC.id);
        });

        it('reverts setting ADMIN_ROLE admin', async function () {
          await expect(this.manager.connect(this.admin).setRoleAdmin(this.roles.ADMIN.id, this.roles.ADMIN.id))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.ADMIN.id);
        });
      });

      describe('#setRoleGuardian', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [93445, 84532];
            const method = this.manager.interface.getFunction('setRoleGuardian(uint64,uint64)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it("sets any role's guardian if called by an admin", async function () {
          await expect(this.manager.getRoleGuardian(this.roles.SOME.id)).to.eventually.equal(
            this.roles.SOME_GUARDIAN.id,
          );

          await expect(this.manager.connect(this.admin).setRoleGuardian(this.roles.SOME.id, this.roles.ADMIN.id))
            .to.emit(this.manager, 'RoleGuardianChanged')
            .withArgs(this.roles.SOME.id, this.roles.ADMIN.id);

          await expect(this.manager.getRoleGuardian(this.roles.SOME.id)).to.eventually.equal(this.roles.ADMIN.id);
        });

        it('reverts setting PUBLIC_ROLE admin', async function () {
          await expect(this.manager.connect(this.admin).setRoleGuardian(this.roles.PUBLIC.id, this.roles.ADMIN.id))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.PUBLIC.id);
        });

        it('reverts setting ADMIN_ROLE admin', async function () {
          await expect(this.manager.connect(this.admin).setRoleGuardian(this.roles.ADMIN.id, this.roles.ADMIN.id))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.ADMIN.id);
        });
      });

      describe('#setGrantDelay', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [984910, time.duration.days(2)];
            const method = this.manager.interface.getFunction('setGrantDelay(uint64,uint32)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it('reverts setting grant delay for the PUBLIC_ROLE', async function () {
          await expect(this.manager.connect(this.admin).setGrantDelay(this.roles.PUBLIC.id, 69n))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
            .withArgs(this.roles.PUBLIC.id);
        });

        describe('when increasing the delay', function () {
          const oldDelay = 10n;
          const newDelay = 100n;

          beforeEach('sets old delay', async function () {
            this.role = this.roles.SOME;
            await this.manager.$_setGrantDelay(this.role.id, oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(oldDelay);
          });

          it('increases the delay after minsetback', async function () {
            const txResponse = await this.manager.connect(this.admin).setGrantDelay(this.role.id, newDelay);
            const setGrantDelayAt = await time.clockFromReceipt.timestamp(txResponse);
            await expect(txResponse)
              .to.emit(this.manager, 'RoleGrantDelayChanged')
              .withArgs(this.role.id, newDelay, setGrantDelayAt + MINSETBACK);

            await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(newDelay);
          });
        });

        describe('when reducing the delay', function () {
          const oldDelay = time.duration.days(10);

          beforeEach('sets old delay', async function () {
            this.role = this.roles.SOME;
            await this.manager.$_setGrantDelay(this.role.id, oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(oldDelay);
          });

          describe('when the delay difference is shorter than minimum setback', function () {
            const newDelay = oldDelay - 1n;

            it('increases the delay after minsetback', async function () {
              const txResponse = await this.manager.connect(this.admin).setGrantDelay(this.role.id, newDelay);
              const setGrantDelayAt = await time.clockFromReceipt.timestamp(txResponse);
              await expect(txResponse)
                .to.emit(this.manager, 'RoleGrantDelayChanged')
                .withArgs(this.role.id, newDelay, setGrantDelayAt + MINSETBACK);

              await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(oldDelay);
              await time.increaseBy.timestamp(MINSETBACK);
              await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(newDelay);
            });
          });

          describe('when the delay difference is longer than minimum setback', function () {
            const newDelay = 1n;

            beforeEach('assert delay difference is higher than minsetback', function () {
              expect(oldDelay - newDelay).to.gt(MINSETBACK);
            });

            it('increases the delay after delay difference', async function () {
              const setback = oldDelay - newDelay;

              const txResponse = await this.manager.connect(this.admin).setGrantDelay(this.role.id, newDelay);
              const setGrantDelayAt = await time.clockFromReceipt.timestamp(txResponse);

              await expect(txResponse)
                .to.emit(this.manager, 'RoleGrantDelayChanged')
                .withArgs(this.role.id, newDelay, setGrantDelayAt + setback);

              await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(oldDelay);
              await time.increaseBy.timestamp(setback);
              await expect(this.manager.getRoleGrantDelay(this.role.id)).to.eventually.equal(newDelay);
            });
          });
        });
      });

      describe('#setTargetAdminDelay', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [this.other.address, time.duration.days(3)];
            const method = this.manager.interface.getFunction('setTargetAdminDelay(address,uint32)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        describe('when increasing the delay', function () {
          const oldDelay = time.duration.days(10);
          const newDelay = time.duration.days(11);

          beforeEach('sets old delay', async function () {
            await this.manager.$_setTargetAdminDelay(this.other, oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(oldDelay);
          });

          it('increases the delay after minsetback', async function () {
            const txResponse = await this.manager.connect(this.admin).setTargetAdminDelay(this.other, newDelay);
            const setTargetAdminDelayAt = await time.clockFromReceipt.timestamp(txResponse);
            await expect(txResponse)
              .to.emit(this.manager, 'TargetAdminDelayUpdated')
              .withArgs(this.other, newDelay, setTargetAdminDelayAt + MINSETBACK);

            await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(newDelay);
          });
        });

        describe('when reducing the delay', function () {
          const oldDelay = time.duration.days(10);

          beforeEach('sets old delay', async function () {
            await this.manager.$_setTargetAdminDelay(this.other, oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(oldDelay);
          });

          describe('when the delay difference is shorter than minimum setback', function () {
            const newDelay = oldDelay - 1n;

            it('increases the delay after minsetback', async function () {
              const txResponse = await this.manager.connect(this.admin).setTargetAdminDelay(this.other, newDelay);
              const setTargetAdminDelayAt = await time.clockFromReceipt.timestamp(txResponse);
              await expect(txResponse)
                .to.emit(this.manager, 'TargetAdminDelayUpdated')
                .withArgs(this.other, newDelay, setTargetAdminDelayAt + MINSETBACK);

              await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(oldDelay);
              await time.increaseBy.timestamp(MINSETBACK);
              await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(newDelay);
            });
          });

          describe('when the delay difference is longer than minimum setback', function () {
            const newDelay = 1n;

            beforeEach('assert delay difference is higher than minsetback', function () {
              expect(oldDelay - newDelay).to.gt(MINSETBACK);
            });

            it('increases the delay after delay difference', async function () {
              const setback = oldDelay - newDelay;

              const txResponse = await this.manager.connect(this.admin).setTargetAdminDelay(this.other, newDelay);
              const setTargetAdminDelayAt = await time.clockFromReceipt.timestamp(txResponse);

              await expect(txResponse)
                .to.emit(this.manager, 'TargetAdminDelayUpdated')
                .withArgs(this.other, newDelay, setTargetAdminDelayAt + setback);

              await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(oldDelay);
              await time.increaseBy.timestamp(setback);
              await expect(this.manager.getTargetAdminDelay(this.other)).to.eventually.equal(newDelay);
            });
          });
        });
      });
    });

    describe('not subject to a delay', function () {
      describe('#updateAuthority', function () {
        beforeEach('create a target and a new authority', async function () {
          this.newAuthority = await ethers.deployContract('$AccessManager', [this.admin]);
          this.newManagedTarget = await ethers.deployContract('$AccessManagedTarget', [this.manager]);
        });

        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            this.calldata = this.manager.interface.encodeFunctionData('updateAuthority(address,address)', [
              this.newManagedTarget.target,
              this.newAuthority.target,
            ]);
          });

          shouldBehaveLikeNotDelayedAdminOperation();
        });

        it('changes the authority', async function () {
          await expect(this.newManagedTarget.authority()).to.eventually.equal(this.manager);

          await expect(this.manager.connect(this.admin).updateAuthority(this.newManagedTarget, this.newAuthority))
            .to.emit(this.newManagedTarget, 'AuthorityUpdated') // Managed contract is responsible of notifying the change through an event
            .withArgs(this.newAuthority);

          await expect(this.newManagedTarget.authority()).to.eventually.equal(this.newAuthority);
        });
      });

      describe('#setTargetClosed', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [this.other.address, true];
            const method = this.manager.interface.getFunction('setTargetClosed(address,bool)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeNotDelayedAdminOperation();
        });

        it('closes and opens a target', async function () {
          await expect(this.manager.connect(this.admin).setTargetClosed(this.target, true))
            .to.emit(this.manager, 'TargetClosed')
            .withArgs(this.target, true);
          await expect(this.manager.isTargetClosed(this.target)).to.eventually.be.true;

          await expect(this.manager.connect(this.admin).setTargetClosed(this.target, false))
            .to.emit(this.manager, 'TargetClosed')
            .withArgs(this.target, false);
          await expect(this.manager.isTargetClosed(this.target)).to.eventually.be.false;
        });

        describe('when the target is the manager', async function () {
          it('closes and opens the manager', async function () {
            await expect(this.manager.connect(this.admin).setTargetClosed(this.manager, true))
              .to.emit(this.manager, 'TargetClosed')
              .withArgs(this.manager, true);
            await expect(this.manager.isTargetClosed(this.manager)).to.eventually.be.true;

            await expect(this.manager.connect(this.admin).setTargetClosed(this.manager, false))
              .to.emit(this.manager, 'TargetClosed')
              .withArgs(this.manager, false);
            await expect(this.manager.isTargetClosed(this.manager)).to.eventually.be.false;
          });
        });
      });

      describe('#setTargetFunctionRole', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', function () {
            const args = [this.other.address, ['0x12345678'], 443342];
            const method = this.manager.interface.getFunction('setTargetFunctionRole(address,bytes4[],uint64)');
            this.calldata = this.manager.interface.encodeFunctionData(method, args);
          });

          shouldBehaveLikeNotDelayedAdminOperation();
        });

        const sigs = ['someFunction()', 'someOtherFunction(uint256)', 'oneMoreFunction(address,uint8)'].map(selector);

        it('sets function roles', async function () {
          for (const sig of sigs) {
            await expect(this.manager.getTargetFunctionRole(this.target, sig)).to.eventually.equal(this.roles.ADMIN.id);
          }

          const allowRole = await this.manager
            .connect(this.admin)
            .setTargetFunctionRole(this.target, sigs, this.roles.SOME.id);

          for (const sig of sigs) {
            await expect(allowRole)
              .to.emit(this.manager, 'TargetFunctionRoleUpdated')
              .withArgs(this.target, sig, this.roles.SOME.id);
            await expect(this.manager.getTargetFunctionRole(this.target, sig)).to.eventually.equal(this.roles.SOME.id);
          }

          await expect(
            this.manager.connect(this.admin).setTargetFunctionRole(this.target, [sigs[1]], this.roles.SOME_ADMIN.id),
          )
            .to.emit(this.manager, 'TargetFunctionRoleUpdated')
            .withArgs(this.target, sigs[1], this.roles.SOME_ADMIN.id);

          for (const sig of sigs) {
            await expect(this.manager.getTargetFunctionRole(this.target, sig)).to.eventually.equal(
              sig == sigs[1] ? this.roles.SOME_ADMIN.id : this.roles.SOME.id,
            );
          }
        });
      });

      describe('role admin operations', function () {
        const ANOTHER_ADMIN = 0xdeadc0de1n;
        const ANOTHER_ROLE = 0xdeadc0de2n;

        beforeEach('set required role', async function () {
          // Make admin a member of ANOTHER_ADMIN
          await this.manager.$_grantRole(ANOTHER_ADMIN, this.admin, 0, 0);
          await this.manager.$_setRoleAdmin(ANOTHER_ROLE, ANOTHER_ADMIN);

          this.role = { id: ANOTHER_ADMIN };
          await this.manager.$_grantRole(this.role.id, this.user, 0, 0);
        });

        describe('#grantRole', function () {
          describe('restrictions', function () {
            beforeEach('set method and args', function () {
              const args = [ANOTHER_ROLE, this.other.address, 0];
              const method = this.manager.interface.getFunction('grantRole(uint64,address,uint32)');
              this.calldata = this.manager.interface.encodeFunctionData(method, args);
            });

            shouldBehaveLikeRoleAdminOperation(ANOTHER_ADMIN);
          });

          it('reverts when granting PUBLIC_ROLE', async function () {
            await expect(this.manager.connect(this.admin).grantRole(this.roles.PUBLIC.id, this.user, 0))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
              .withArgs(this.roles.PUBLIC.id);
          });

          describe('when the user is not a role member', function () {
            describe('with grant delay', function () {
              beforeEach('set grant delay and grant role', async function () {
                // Delay granting
                this.grantDelay = time.duration.weeks(2);
                await this.manager.$_setGrantDelay(ANOTHER_ROLE, this.grantDelay);
                await time.increaseBy.timestamp(MINSETBACK);

                // Grant role
                this.executionDelay = time.duration.days(3);
                await expect(
                  this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                ).to.eventually.be.deep.equal([false, '0']);

                this.txResponse = await this.manager
                  .connect(this.admin)
                  .grantRole(ANOTHER_ROLE, this.user, this.executionDelay);
                this.delay = this.grantDelay; // For testAsDelay
              });

              testAsDelay('grant', {
                before: function self() {
                  self.mineDelay = true;

                  it('does not grant role to the user yet', async function () {
                    const timestamp = await time.clockFromReceipt.timestamp(this.txResponse);
                    await expect(this.txResponse)
                      .to.emit(this.manager, 'RoleGranted')
                      .withArgs(ANOTHER_ROLE, this.user, this.executionDelay, timestamp + this.grantDelay, true);

                    // Access is correctly stored
                    const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                    expect(access[0]).to.equal(timestamp + this.grantDelay); // inEffectSince
                    expect(access[1]).to.equal(this.executionDelay); // currentDelay
                    expect(access[2]).to.equal(0n); // pendingDelay
                    expect(access[3]).to.equal(0n); // pendingDelayEffect

                    // Not in effect yet
                    const currentTimestamp = await time.clock.timestamp();
                    expect(currentTimestamp).to.be.lt(access[0]);
                    await expect(
                      this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                    ).to.eventually.be.deep.equal([false, this.executionDelay.toString()]);
                  });
                },
                after: function self() {
                  self.mineDelay = true;

                  it('grants role to the user', async function () {
                    const timestamp = await time.clockFromReceipt.timestamp(this.txResponse);
                    await expect(this.txResponse)
                      .to.emit(this.manager, 'RoleGranted')
                      .withArgs(ANOTHER_ROLE, this.user, this.executionDelay, timestamp + this.grantDelay, true);

                    // Access is correctly stored
                    const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                    expect(access[0]).to.equal(timestamp + this.grantDelay); // inEffectSince
                    expect(access[1]).to.equal(this.executionDelay); // currentDelay
                    expect(access[2]).to.equal(0n); // pendingDelay
                    expect(access[3]).to.equal(0n); // pendingDelayEffect

                    // Already in effect
                    const currentTimestamp = await time.clock.timestamp();
                    expect(currentTimestamp).to.equal(access[0]);
                    await expect(
                      this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                    ).to.eventually.be.deep.equal([true, this.executionDelay.toString()]);
                  });
                },
              });
            });

            describe('without grant delay', function () {
              beforeEach('set granting delay', async function () {
                // Delay granting
                this.grantDelay = 0;
                await this.manager.$_setGrantDelay(ANOTHER_ROLE, this.grantDelay);
                await time.increaseBy.timestamp(MINSETBACK);
              });

              it('immediately grants the role to the user', async function () {
                const executionDelay = time.duration.days(6);
                await expect(
                  this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                ).to.eventually.be.deep.equal([false, '0']);
                const txResponse = await this.manager
                  .connect(this.admin)
                  .grantRole(ANOTHER_ROLE, this.user, executionDelay);
                const grantedAt = await time.clockFromReceipt.timestamp(txResponse);
                await expect(txResponse)
                  .to.emit(this.manager, 'RoleGranted')
                  .withArgs(ANOTHER_ROLE, this.user, executionDelay, grantedAt, true);

                // Access is correctly stored
                const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                expect(access[0]).to.equal(grantedAt); // inEffectSince
                expect(access[1]).to.equal(executionDelay); // currentDelay
                expect(access[2]).to.equal(0n); // pendingDelay
                expect(access[3]).to.equal(0n); // pendingDelayEffect

                // Already in effect
                const currentTimestamp = await time.clock.timestamp();
                expect(currentTimestamp).to.equal(access[0]);
                await expect(
                  this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                ).to.eventually.be.deep.equal([true, executionDelay.toString()]);
              });
            });
          });

          describe('when the user is already a role member', function () {
            beforeEach('make user role member', async function () {
              this.previousExecutionDelay = time.duration.days(6);
              await this.manager.$_grantRole(ANOTHER_ROLE, this.user, 0, this.previousExecutionDelay);
              this.oldAccess = await this.manager.getAccess(ANOTHER_ROLE, this.user);
            });

            describe('with grant delay', function () {
              beforeEach('set granting delay', async function () {
                // Delay granting
                const grantDelay = time.duration.weeks(2);
                await this.manager.$_setGrantDelay(ANOTHER_ROLE, grantDelay);
                await time.increaseBy.timestamp(MINSETBACK);
              });

              describe('when increasing the execution delay', function () {
                beforeEach('set increased new execution delay', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);

                  this.newExecutionDelay = this.previousExecutionDelay + time.duration.days(4);
                });

                it('emits event and immediately changes the execution delay', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);
                  const txResponse = await this.manager
                    .connect(this.admin)
                    .grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay);
                  const timestamp = await time.clockFromReceipt.timestamp(txResponse);

                  await expect(txResponse)
                    .to.emit(this.manager, 'RoleGranted')
                    .withArgs(ANOTHER_ROLE, this.user, this.newExecutionDelay, timestamp, false);

                  // Access is correctly stored
                  const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                  expect(access[0]).to.equal(this.oldAccess[0]); // inEffectSince
                  expect(access[1]).to.equal(this.newExecutionDelay); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // pendingDelayEffect

                  // Already in effect
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.newExecutionDelay.toString()]);
                });
              });

              describe('when decreasing the execution delay', function () {
                beforeEach('decrease execution delay', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);

                  this.newExecutionDelay = this.previousExecutionDelay - time.duration.days(4);
                  this.txResponse = await this.manager
                    .connect(this.admin)
                    .grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay);
                  this.grantTimestamp = await time.clockFromReceipt.timestamp(this.txResponse);

                  this.delay = this.previousExecutionDelay - this.newExecutionDelay; // For testAsDelay
                });

                it('emits event', async function () {
                  await expect(this.txResponse)
                    .to.emit(this.manager, 'RoleGranted')
                    .withArgs(ANOTHER_ROLE, this.user, this.newExecutionDelay, this.grantTimestamp + this.delay, false);
                });

                testAsDelay('execution delay effect', {
                  before: function self() {
                    self.mineDelay = true;

                    it('does not change the execution delay yet', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                      expect(access[0]).to.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.equal(this.previousExecutionDelay); // currentDelay
                      expect(access[2]).to.equal(this.newExecutionDelay); // pendingDelay
                      expect(access[3]).to.equal(this.grantTimestamp + this.delay); // pendingDelayEffect

                      // Not in effect yet
                      await expect(
                        this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                      ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);
                    });
                  },
                  after: function self() {
                    self.mineDelay = true;

                    it('changes the execution delay', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);

                      expect(access[0]).to.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.equal(this.newExecutionDelay); // currentDelay
                      expect(access[2]).to.equal(0n); // pendingDelay
                      expect(access[3]).to.equal(0n); // pendingDelayEffect

                      // Already in effect
                      await expect(
                        this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                      ).to.eventually.be.deep.equal([true, this.newExecutionDelay.toString()]);
                    });
                  },
                });
              });
            });

            describe('without grant delay', function () {
              beforeEach('set granting delay', async function () {
                // Delay granting
                const grantDelay = 0;
                await this.manager.$_setGrantDelay(ANOTHER_ROLE, grantDelay);
                await time.increaseBy.timestamp(MINSETBACK);
              });

              describe('when increasing the execution delay', function () {
                beforeEach('set increased new execution delay', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);

                  this.newExecutionDelay = this.previousExecutionDelay + time.duration.days(4);
                });

                it('emits event and immediately changes the execution delay', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);
                  const txResponse = await this.manager
                    .connect(this.admin)
                    .grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay);
                  const timestamp = await time.clockFromReceipt.timestamp(txResponse);

                  await expect(txResponse)
                    .to.emit(this.manager, 'RoleGranted')
                    .withArgs(ANOTHER_ROLE, this.user, this.newExecutionDelay, timestamp, false);

                  // Access is correctly stored
                  const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                  expect(access[0]).to.equal(this.oldAccess[0]); // inEffectSince
                  expect(access[1]).to.equal(this.newExecutionDelay); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // pendingDelayEffect

                  // Already in effect
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.newExecutionDelay.toString()]);
                });
              });

              describe('when decreasing the execution delay', function () {
                beforeEach('decrease execution delay', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);

                  this.newExecutionDelay = this.previousExecutionDelay - time.duration.days(4);
                  this.txResponse = await this.manager
                    .connect(this.admin)
                    .grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay);
                  this.grantTimestamp = await time.clockFromReceipt.timestamp(this.txResponse);

                  this.delay = this.previousExecutionDelay - this.newExecutionDelay; // For testAsDelay
                });

                it('emits event', async function () {
                  await expect(this.txResponse)
                    .to.emit(this.manager, 'RoleGranted')
                    .withArgs(ANOTHER_ROLE, this.user, this.newExecutionDelay, this.grantTimestamp + this.delay, false);
                });

                testAsDelay('execution delay effect', {
                  before: function self() {
                    self.mineDelay = true;

                    it('does not change the execution delay yet', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                      expect(access[0]).to.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.equal(this.previousExecutionDelay); // currentDelay
                      expect(access[2]).to.equal(this.newExecutionDelay); // pendingDelay
                      expect(access[3]).to.equal(this.grantTimestamp + this.delay); // pendingDelayEffect

                      // Not in effect yet
                      await expect(
                        this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                      ).to.eventually.be.deep.equal([true, this.previousExecutionDelay.toString()]);
                    });
                  },
                  after: function self() {
                    self.mineDelay = true;

                    it('changes the execution delay', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);

                      expect(access[0]).to.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.equal(this.newExecutionDelay); // currentDelay
                      expect(access[2]).to.equal(0n); // pendingDelay
                      expect(access[3]).to.equal(0n); // pendingDelayEffect

                      // Already in effect
                      await expect(
                        this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                      ).to.eventually.be.deep.equal([true, this.newExecutionDelay.toString()]);
                    });
                  },
                });
              });
            });
          });
        });

        describe('#revokeRole', function () {
          describe('restrictions', function () {
            beforeEach('set method and args', async function () {
              const args = [ANOTHER_ROLE, this.other.address];
              const method = this.manager.interface.getFunction('revokeRole(uint64,address)');
              this.calldata = this.manager.interface.encodeFunctionData(method, args);

              // Need to be set before revoking
              await this.manager.$_grantRole(...args, 0, 0);
            });

            shouldBehaveLikeRoleAdminOperation(ANOTHER_ADMIN);
          });

          describe('when role has been granted', function () {
            beforeEach('grant role with grant delay', async function () {
              this.grantDelay = time.duration.weeks(1);
              await this.manager.$_grantRole(ANOTHER_ROLE, this.user, this.grantDelay, 0);

              this.delay = this.grantDelay; // For testAsDelay
            });

            testAsDelay('grant', {
              before: function self() {
                self.mineDelay = true;

                it('revokes a granted role that will take effect in the future', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([false, '0']);

                  await expect(this.manager.connect(this.admin).revokeRole(ANOTHER_ROLE, this.user))
                    .to.emit(this.manager, 'RoleRevoked')
                    .withArgs(ANOTHER_ROLE, this.user);

                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([false, '0']);

                  const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                  expect(access[0]).to.equal(0n); // inRoleSince
                  expect(access[1]).to.equal(0n); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // effect
                });
              },
              after: function self() {
                self.mineDelay = true;

                it('revokes a granted role that already took effect', async function () {
                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([true, '0']);

                  await expect(this.manager.connect(this.admin).revokeRole(ANOTHER_ROLE, this.user))
                    .to.emit(this.manager, 'RoleRevoked')
                    .withArgs(ANOTHER_ROLE, this.user);

                  await expect(
                    this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess),
                  ).to.eventually.be.deep.equal([false, '0']);

                  const access = await this.manager.getAccess(ANOTHER_ROLE, this.user);
                  expect(access[0]).to.equal(0n); // inRoleSince
                  expect(access[1]).to.equal(0n); // currentDelay
                  expect(access[2]).to.equal(0n); // pendingDelay
                  expect(access[3]).to.equal(0n); // effect
                });
              },
            });
          });

          describe('when role has not been granted', function () {
            it('has no effect', async function () {
              await expect(
                this.manager.hasRole(this.roles.SOME.id, this.user).then(formatAccess),
              ).to.eventually.be.deep.equal([false, '0']);
              await expect(this.manager.connect(this.roleAdmin).revokeRole(this.roles.SOME.id, this.user)).to.not.emit(
                this.manager,
                'RoleRevoked',
              );
              await expect(
                this.manager.hasRole(this.roles.SOME.id, this.user).then(formatAccess),
              ).to.eventually.be.deep.equal([false, '0']);
            });
          });

          it('reverts revoking PUBLIC_ROLE', async function () {
            await expect(this.manager.connect(this.admin).revokeRole(this.roles.PUBLIC.id, this.user))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
              .withArgs(this.roles.PUBLIC.id);
          });
        });
      });

      describe('self role operations', function () {
        describe('#renounceRole', function () {
          beforeEach('grant role', async function () {
            this.role = { id: 783164n };
            this.caller = this.user;
            await this.manager.$_grantRole(this.role.id, this.caller, 0, 0);
          });

          it('renounces a role', async function () {
            await expect(
              this.manager.hasRole(this.role.id, this.caller).then(formatAccess),
            ).to.eventually.be.deep.equal([true, '0']);
            await expect(this.manager.connect(this.caller).renounceRole(this.role.id, this.caller))
              .to.emit(this.manager, 'RoleRevoked')
              .withArgs(this.role.id, this.caller);
            await expect(
              this.manager.hasRole(this.role.id, this.caller).then(formatAccess),
            ).to.eventually.be.deep.equal([false, '0']);
          });

          it('reverts if renouncing the PUBLIC_ROLE', async function () {
            await expect(this.manager.connect(this.caller).renounceRole(this.roles.PUBLIC.id, this.caller))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedRole')
              .withArgs(this.roles.PUBLIC.id);
          });

          it('reverts if renouncing with bad caller confirmation', async function () {
            await expect(
              this.manager.connect(this.caller).renounceRole(this.role.id, this.other),
            ).to.be.revertedWithCustomError(this.manager, 'AccessManagerBadConfirmation');
          });
        });
      });
    });
  });

  describe('access managed self operations', function () {
    describe('when calling a restricted target function', function () {
      const method = 'fnRestricted()';

      beforeEach('set required role', async function () {
        this.role = { id: 785913n };
        await this.manager.$_setTargetFunctionRole(
          this.manager,
          this.manager[method].getFragment().selector,
          this.role.id,
        );
      });

      describe('restrictions', function () {
        beforeEach('set method and args', function () {
          this.caller = this.user;
          this.calldata = this.manager.interface.encodeFunctionData(method, []);
        });

        shouldBehaveLikeASelfRestrictedOperation();
      });

      it('succeeds called by a role member', async function () {
        await this.manager.$_grantRole(this.role.id, this.user, 0, 0);

        await expect(this.manager.connect(this.user)[method]())
          .to.emit(this.manager, 'CalledRestricted')
          .withArgs(this.user);
      });
    });

    describe('when calling a non-restricted target function', function () {
      const method = 'fnUnrestricted()';

      beforeEach('set required role', async function () {
        this.role = { id: 879435n };
        await this.manager.$_setTargetFunctionRole(
          this.manager,
          this.manager[method].getFragment().selector,
          this.role.id,
        );
      });

      it('succeeds called by anyone', async function () {
        await expect(this.manager.connect(this.user)[method]())
          .to.emit(this.manager, 'CalledUnrestricted')
          .withArgs(this.user);
      });
    });
  });

  describe('access managed target operations', function () {
    describe('when calling a restricted target function', function () {
      const method = 'fnRestricted()';

      beforeEach('set required role', async function () {
        this.role = { id: 3597243n };
        await this.manager.$_setTargetFunctionRole(
          this.target,
          this.target[method].getFragment().selector,
          this.role.id,
        );
      });

      describe('restrictions', function () {
        beforeEach('set method and args', function () {
          this.caller = this.user;
          this.calldata = this.target.interface.encodeFunctionData(method, []);
        });

        shouldBehaveLikeAManagedRestrictedOperation();
      });

      it('succeeds called by a role member', async function () {
        await this.manager.$_grantRole(this.role.id, this.user, 0, 0);

        await expect(this.target.connect(this.user)[method]())
          .to.emit(this.target, 'CalledRestricted')
          .withArgs(this.user);
      });
    });

    describe('when calling a non-restricted target function', function () {
      const method = 'fnUnrestricted()';

      beforeEach('set required role', async function () {
        this.role = { id: 879435n };
        await this.manager.$_setTargetFunctionRole(
          this.target,
          this.target[method].getFragment().selector,
          this.role.id,
        );
      });

      it('succeeds called by anyone', async function () {
        await expect(this.target.connect(this.user)[method]())
          .to.emit(this.target, 'CalledUnrestricted')
          .withArgs(this.user);
      });
    });
  });

  describe('#schedule', function () {
    beforeEach('set target function role', async function () {
      this.method = this.target.fnRestricted.getFragment();
      this.role = { id: 498305n };
      this.caller = this.user;

      await this.manager.$_setTargetFunctionRole(this.target, this.method.selector, this.role.id);
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 1); // nonzero execution delay

      this.calldata = this.target.interface.encodeFunctionData(this.method, []);
      this.delay = time.duration.weeks(2);
    });

    describe('restrictions', function () {
      testAsCanCall({
        closed() {
          it('reverts as AccessManagerUnauthorizedCall', async function () {
            const { schedule } = await prepareOperation(this.manager, {
              caller: this.caller,
              target: this.target,
              calldata: this.calldata,
              delay: this.delay,
            });
            await expect(schedule())
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
              .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
          });
        },
        open: {
          callerIsTheManager: {
            executing() {
              it.skip('is not reachable because schedule is not restrictable');
            },
            notExecuting() {
              it('reverts as AccessManagerUnauthorizedCall', async function () {
                const { schedule } = await prepareOperation(this.manager, {
                  caller: this.caller,
                  target: this.target,
                  calldata: this.calldata,
                  delay: this.delay,
                });
                await expect(schedule())
                  .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                  .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
              });
            },
          },
          callerIsNotTheManager: {
            publicRoleIsRequired() {
              it('reverts as AccessManagerUnauthorizedCall', async function () {
                // prepareOperation is not used here because it alters the next block timestamp
                await expect(this.manager.connect(this.caller).schedule(this.target, this.calldata, MAX_UINT48))
                  .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                  .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
              });
            },
            specificRoleIsRequired: {
              requiredRoleIsGranted: {
                roleGrantingIsDelayed: {
                  callerHasAnExecutionDelay: {
                    beforeGrantDelay() {
                      it('reverts as AccessManagerUnauthorizedCall', async function () {
                        // prepareOperation is not used here because it alters the next block timestamp
                        await expect(this.manager.connect(this.caller).schedule(this.target, this.calldata, MAX_UINT48))
                          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                          .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                      });
                    },
                    afterGrantDelay() {
                      it('succeeds', async function () {
                        // prepareOperation is not used here because it alters the next block timestamp
                        await this.manager.connect(this.caller).schedule(this.target, this.calldata, MAX_UINT48);
                      });
                    },
                  },
                  callerHasNoExecutionDelay: {
                    beforeGrantDelay() {
                      it('reverts as AccessManagerUnauthorizedCall', async function () {
                        // prepareOperation is not used here because it alters the next block timestamp
                        await expect(this.manager.connect(this.caller).schedule(this.target, this.calldata, MAX_UINT48))
                          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                          .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                      });
                    },
                    afterGrantDelay() {
                      it('reverts as AccessManagerUnauthorizedCall', async function () {
                        // prepareOperation is not used here because it alters the next block timestamp
                        await expect(this.manager.connect(this.caller).schedule(this.target, this.calldata, MAX_UINT48))
                          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                          .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                      });
                    },
                  },
                },
                roleGrantingIsNotDelayed: {
                  callerHasAnExecutionDelay() {
                    it('succeeds', async function () {
                      const { schedule } = await prepareOperation(this.manager, {
                        caller: this.caller,
                        target: this.target,
                        calldata: this.calldata,
                        delay: this.delay,
                      });

                      await schedule();
                    });
                  },
                  callerHasNoExecutionDelay() {
                    it('reverts as AccessManagerUnauthorizedCall', async function () {
                      // prepareOperation is not used here because it alters the next block timestamp
                      await expect(this.manager.connect(this.caller).schedule(this.target, this.calldata, MAX_UINT48))
                        .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                        .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                    });
                  },
                },
              },
              requiredRoleIsNotGranted() {
                it('reverts as AccessManagerUnauthorizedCall', async function () {
                  const { schedule } = await prepareOperation(this.manager, {
                    caller: this.caller,
                    target: this.target,
                    calldata: this.calldata,
                    delay: this.delay,
                  });
                  await expect(schedule())
                    .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                    .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                });
              },
            },
          },
        },
      });
    });

    it('schedules an operation at the specified execution date if it is larger than caller execution delay', async function () {
      const { operationId, scheduledAt, schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.delay,
      });

      const txResponse = await schedule();

      await expect(this.manager.getSchedule(operationId)).to.eventually.equal(scheduledAt + this.delay);
      await expect(txResponse)
        .to.emit(this.manager, 'OperationScheduled')
        .withArgs(operationId, '1', scheduledAt + this.delay, this.caller, this.target, this.calldata);
    });

    it('schedules an operation at the minimum execution date if no specified execution date (when == 0)', async function () {
      const executionDelay = await time.duration.hours(72);
      await this.manager.$_grantRole(this.role.id, this.caller, 0, executionDelay);

      const txResponse = await this.manager.connect(this.caller).schedule(this.target, this.calldata, 0);
      const scheduledAt = await time.clockFromReceipt.timestamp(txResponse);

      const operationId = await this.manager.hashOperation(this.caller, this.target, this.calldata);

      await expect(this.manager.getSchedule(operationId)).to.eventually.equal(scheduledAt + executionDelay);
      await expect(txResponse)
        .to.emit(this.manager, 'OperationScheduled')
        .withArgs(operationId, '1', scheduledAt + executionDelay, this.caller, this.target, this.calldata);
    });

    it('increases the nonce of an operation scheduled more than once', async function () {
      // Setup and check initial nonce
      const expectedOperationId = hashOperation(this.caller, this.target, this.calldata);
      await expect(this.manager.getNonce(expectedOperationId)).to.eventually.equal('0');

      // Schedule
      const op1 = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.delay,
      });
      await expect(op1.schedule())
        .to.emit(this.manager, 'OperationScheduled')
        .withArgs(op1.operationId, 1n, op1.scheduledAt + this.delay, this.caller, this.target, this.calldata);
      expect(expectedOperationId).to.equal(op1.operationId);

      // Consume
      await time.increaseBy.timestamp(this.delay);
      await this.manager.$_consumeScheduledOp(expectedOperationId);

      // Check nonce
      await expect(this.manager.getNonce(expectedOperationId)).to.eventually.equal('1');

      // Schedule again
      const op2 = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.delay,
      });
      await expect(op2.schedule())
        .to.emit(this.manager, 'OperationScheduled')
        .withArgs(op2.operationId, 2n, op2.scheduledAt + this.delay, this.caller, this.target, this.calldata);
      expect(expectedOperationId).to.equal(op2.operationId);

      // Check final nonce
      await expect(this.manager.getNonce(expectedOperationId)).to.eventually.equal('2');
    });

    it('reverts if the specified execution date is before the current timestamp + caller execution delay', async function () {
      const executionDelay = time.duration.weeks(1) + this.delay;
      await this.manager.$_grantRole(this.role.id, this.caller, 0, executionDelay);

      const { schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.delay,
      });

      await expect(schedule())
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
        .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
    });

    it('reverts if an operation is already schedule', async function () {
      const op1 = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.delay,
      });

      await op1.schedule();

      const op2 = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.delay,
      });

      await expect(op2.schedule())
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerAlreadyScheduled')
        .withArgs(op1.operationId);
    });

    it('panics scheduling calldata with less than 4 bytes', async function () {
      const calldata = '0x1234'; // 2 bytes

      // Managed contract
      const op1 = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: calldata,
        delay: this.delay,
      });
      await expect(op1.schedule()).to.be.revertedWithoutReason();

      // Manager contract
      const op2 = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.manager,
        calldata: calldata,
        delay: this.delay,
      });
      await expect(op2.schedule()).to.be.revertedWithoutReason();
    });

    it('reverts scheduling an unknown operation to the manager', async function () {
      const calldata = '0x12345678';

      const { schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.manager,
        calldata,
        delay: this.delay,
      });

      await expect(schedule())
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
        .withArgs(this.caller, this.manager, calldata);
    });
  });

  describe('#execute', function () {
    beforeEach('set target function role', async function () {
      this.method = this.target.fnRestricted.getFragment();
      this.role = { id: 9825430n };
      this.caller = this.user;

      await this.manager.$_setTargetFunctionRole(this.target, this.method.selector, this.role.id);
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 0);

      this.calldata = this.target.interface.encodeFunctionData(this.method, []);
    });

    describe('restrictions', function () {
      testAsCanCall({
        closed() {
          it('reverts as AccessManagerUnauthorizedCall', async function () {
            await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
              .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
          });
        },
        open: {
          callerIsTheManager: {
            executing() {
              it('succeeds', async function () {
                await this.manager.connect(this.caller).execute(this.target, this.calldata);
              });
            },
            notExecuting() {
              it('reverts as AccessManagerUnauthorizedCall', async function () {
                await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
                  .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                  .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
              });
            },
          },
          callerIsNotTheManager: {
            publicRoleIsRequired() {
              it('succeeds', async function () {
                await this.manager.connect(this.caller).execute(this.target, this.calldata);
              });
            },
            specificRoleIsRequired: {
              requiredRoleIsGranted: {
                roleGrantingIsDelayed: {
                  callerHasAnExecutionDelay: {
                    beforeGrantDelay() {
                      it('reverts as AccessManagerUnauthorizedCall', async function () {
                        await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
                          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                          .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                      });
                    },
                    afterGrantDelay: function self() {
                      self.mineDelay = true;

                      beforeEach('define schedule delay', function () {
                        this.scheduleIn = time.duration.days(21); // For testAsSchedulableOperation
                      });

                      testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
                    },
                  },
                  callerHasNoExecutionDelay: {
                    beforeGrantDelay() {
                      it('reverts as AccessManagerUnauthorizedCall', async function () {
                        await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
                          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                          .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                      });
                    },
                    afterGrantDelay: function self() {
                      self.mineDelay = true;

                      it('succeeds', async function () {
                        await this.manager.connect(this.caller).execute(this.target, this.calldata);
                      });
                    },
                  },
                },
                roleGrantingIsNotDelayed: {
                  callerHasAnExecutionDelay() {
                    beforeEach('define schedule delay', function () {
                      this.scheduleIn = time.duration.days(15); // For testAsSchedulableOperation
                    });

                    testAsSchedulableOperation(LIKE_COMMON_SCHEDULABLE);
                  },
                  callerHasNoExecutionDelay() {
                    it('succeeds', async function () {
                      await this.manager.connect(this.caller).execute(this.target, this.calldata);
                    });
                  },
                },
              },
              requiredRoleIsNotGranted() {
                it('reverts as AccessManagerUnauthorizedCall', async function () {
                  await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
                    .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
                    .withArgs(this.caller, this.target, this.calldata.substring(0, 10));
                });
              },
            },
          },
        },
      });
    });

    it('executes with a delay consuming the scheduled operation', async function () {
      const delay = time.duration.hours(4);
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 1); // Execution delay is needed so the operation is consumed

      const { operationId, schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay,
      });
      await schedule();
      await time.increaseBy.timestamp(delay);
      await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
        .to.emit(this.manager, 'OperationExecuted')
        .withArgs(operationId, 1n);

      await expect(this.manager.getSchedule(operationId)).to.eventually.equal(0n);
    });

    it('executes with no delay consuming a scheduled operation', async function () {
      const delay = time.duration.hours(4);

      // give caller an execution delay
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 1);

      const { operationId, schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay,
      });
      await schedule();

      // remove the execution delay
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 0);

      await time.increaseBy.timestamp(delay);
      await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
        .to.emit(this.manager, 'OperationExecuted')
        .withArgs(operationId, 1n);

      await expect(this.manager.getSchedule(operationId)).to.eventually.equal(0n);
    });

    it('keeps the original _executionId after finishing the call', async function () {
      const executionIdBefore = await ethers.provider.getStorage(this.manager, EXECUTION_ID_STORAGE_SLOT);
      await this.manager.connect(this.caller).execute(this.target, this.calldata);
      const executionIdAfter = await ethers.provider.getStorage(this.manager, EXECUTION_ID_STORAGE_SLOT);
      expect(executionIdBefore).to.equal(executionIdAfter);
    });

    it('reverts executing twice', async function () {
      const delay = time.duration.hours(2);
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 1); // Execution delay is needed so the operation is consumed

      const { operationId, schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay,
      });
      await schedule();
      await time.increaseBy.timestamp(delay);
      await this.manager.connect(this.caller).execute(this.target, this.calldata);
      await expect(this.manager.connect(this.caller).execute(this.target, this.calldata))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotScheduled')
        .withArgs(operationId);
    });
  });

  describe('#consumeScheduledOp', function () {
    beforeEach('define scheduling parameters', async function () {
      const method = this.target.fnRestricted.getFragment();
      this.caller = await ethers.getSigner(this.target.target);
      await impersonate(this.caller.address);
      this.calldata = this.target.interface.encodeFunctionData(method, []);
      this.role = { id: 9834983n };

      await this.manager.$_setTargetFunctionRole(this.target, method.selector, this.role.id);
      await this.manager.$_grantRole(this.role.id, this.caller, 0, 1); // nonzero execution delay

      this.scheduleIn = time.duration.hours(10); // For testAsSchedulableOperation
    });

    describe('when caller is not consuming scheduled operation', function () {
      beforeEach('set consuming false', async function () {
        await this.target.setIsConsumingScheduledOp(false, ethers.toBeHex(CONSUMING_SCHEDULE_STORAGE_SLOT, 32));
      });

      it('reverts as AccessManagerUnauthorizedConsume', async function () {
        await expect(this.manager.connect(this.caller).consumeScheduledOp(this.caller, this.calldata))
          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedConsume')
          .withArgs(this.caller);
      });
    });

    describe('when caller is consuming scheduled operation', function () {
      beforeEach('set consuming true', async function () {
        await this.target.setIsConsumingScheduledOp(true, ethers.toBeHex(CONSUMING_SCHEDULE_STORAGE_SLOT, 32));
      });

      testAsSchedulableOperation({
        scheduled: {
          before() {
            it('reverts as AccessManagerNotReady', async function () {
              await expect(this.manager.connect(this.caller).consumeScheduledOp(this.caller, this.calldata))
                .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotReady')
                .withArgs(this.operationId);
            });
          },
          after() {
            it('consumes the scheduled operation and resets timepoint', async function () {
              await expect(this.manager.getSchedule(this.operationId)).to.eventually.equal(
                this.scheduledAt + this.scheduleIn,
              );

              await expect(this.manager.connect(this.caller).consumeScheduledOp(this.caller, this.calldata))
                .to.emit(this.manager, 'OperationExecuted')
                .withArgs(this.operationId, 1n);
              await expect(this.manager.getSchedule(this.operationId)).to.eventually.equal(0n);
            });
          },
          expired() {
            it('reverts as AccessManagerExpired', async function () {
              await expect(this.manager.connect(this.caller).consumeScheduledOp(this.caller, this.calldata))
                .to.be.revertedWithCustomError(this.manager, 'AccessManagerExpired')
                .withArgs(this.operationId);
            });
          },
        },
        notScheduled() {
          it('reverts as AccessManagerNotScheduled', async function () {
            await expect(this.manager.connect(this.caller).consumeScheduledOp(this.caller, this.calldata))
              .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotScheduled')
              .withArgs(this.operationId);
          });
        },
      });
    });
  });

  describe('#cancelScheduledOp', function () {
    beforeEach('setup scheduling', async function () {
      this.method = this.target.fnRestricted.getFragment();
      this.caller = this.roles.SOME.members[0];
      await this.manager.$_setTargetFunctionRole(this.target, this.method.selector, this.roles.SOME.id);
      await this.manager.$_grantRole(this.roles.SOME.id, this.caller, 0, 1); // nonzero execution delay

      this.calldata = this.target.interface.encodeFunctionData(this.method, []);
      this.scheduleIn = time.duration.days(10); // For testAsSchedulableOperation
    });

    testAsSchedulableOperation({
      scheduled: {
        before() {
          describe('when caller is the scheduler', function () {
            it('succeeds', async function () {
              await this.manager.connect(this.caller).cancel(this.caller, this.target, this.calldata);
            });
          });

          describe('when caller is an admin', function () {
            it('succeeds', async function () {
              await this.manager.connect(this.roles.ADMIN.members[0]).cancel(this.caller, this.target, this.calldata);
            });
          });

          describe('when caller is the role guardian', function () {
            it('succeeds', async function () {
              await this.manager
                .connect(this.roles.SOME_GUARDIAN.members[0])
                .cancel(this.caller, this.target, this.calldata);
            });
          });

          describe('when caller is any other account', function () {
            it('reverts as AccessManagerUnauthorizedCancel', async function () {
              await expect(this.manager.connect(this.other).cancel(this.caller, this.target, this.calldata))
                .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCancel')
                .withArgs(this.other, this.caller, this.target, this.method.selector);
            });
          });
        },
        after() {
          it('succeeds', async function () {
            await this.manager.connect(this.caller).cancel(this.caller, this.target, this.calldata);
          });
        },
        expired() {
          it('succeeds', async function () {
            await this.manager.connect(this.caller).cancel(this.caller, this.target, this.calldata);
          });
        },
      },
      notScheduled() {
        it('reverts as AccessManagerNotScheduled', async function () {
          await expect(this.manager.cancel(this.caller, this.target, this.calldata))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerNotScheduled')
            .withArgs(this.operationId);
        });
      },
    });

    it('cancels an operation and resets schedule', async function () {
      const { operationId, schedule } = await prepareOperation(this.manager, {
        caller: this.caller,
        target: this.target,
        calldata: this.calldata,
        delay: this.scheduleIn,
      });
      await schedule();
      await expect(this.manager.connect(this.caller).cancel(this.caller, this.target, this.calldata))
        .to.emit(this.manager, 'OperationCanceled')
        .withArgs(operationId, 1n);
      await expect(this.manager.getSchedule(operationId)).to.eventually.equal('0');
    });
  });

  describe('with Ownable target contract', function () {
    const roleId = 1n;

    beforeEach(async function () {
      this.ownable = await ethers.deployContract('$Ownable', [this.manager]);

      // add user to role
      await this.manager.$_grantRole(roleId, this.user, 0, 0);
    });

    it('initial state', async function () {
      await expect(this.ownable.owner()).to.eventually.equal(this.manager);
    });

    describe('Contract is closed', function () {
      beforeEach(async function () {
        await this.manager.$_setTargetClosed(this.ownable, true);
      });

      it('directly call: reverts', async function () {
        await expect(this.ownable.connect(this.user).$_checkOwner())
          .to.be.revertedWithCustomError(this.ownable, 'OwnableUnauthorizedAccount')
          .withArgs(this.user);
      });

      it('relayed call (with role): reverts', async function () {
        await expect(
          this.manager.connect(this.user).execute(this.ownable, this.ownable.$_checkOwner.getFragment().selector),
        )
          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
          .withArgs(this.user, this.ownable, this.ownable.$_checkOwner.getFragment().selector);
      });

      it('relayed call (without role): reverts', async function () {
        await expect(
          this.manager.connect(this.other).execute(this.ownable, this.ownable.$_checkOwner.getFragment().selector),
        )
          .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
          .withArgs(this.other, this.ownable, this.ownable.$_checkOwner.getFragment().selector);
      });
    });

    describe('Contract is managed', function () {
      describe('function is open to specific role', function () {
        beforeEach(async function () {
          await this.manager.$_setTargetFunctionRole(
            this.ownable,
            this.ownable.$_checkOwner.getFragment().selector,
            roleId,
          );
        });

        it('directly call: reverts', async function () {
          await expect(this.ownable.connect(this.user).$_checkOwner())
            .to.be.revertedWithCustomError(this.ownable, 'OwnableUnauthorizedAccount')
            .withArgs(this.user);
        });

        it('relayed call (with role): success', async function () {
          await this.manager.connect(this.user).execute(this.ownable, this.ownable.$_checkOwner.getFragment().selector);
        });

        it('relayed call (without role): reverts', async function () {
          await expect(
            this.manager.connect(this.other).execute(this.ownable, this.ownable.$_checkOwner.getFragment().selector),
          )
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerUnauthorizedCall')
            .withArgs(this.other, this.ownable, this.ownable.$_checkOwner.getFragment().selector);
        });
      });

      describe('function is open to public role', function () {
        beforeEach(async function () {
          await this.manager.$_setTargetFunctionRole(
            this.ownable,
            this.ownable.$_checkOwner.getFragment().selector,
            this.roles.PUBLIC.id,
          );
        });

        it('directly call: reverts', async function () {
          await expect(this.ownable.connect(this.user).$_checkOwner())
            .to.be.revertedWithCustomError(this.ownable, 'OwnableUnauthorizedAccount')
            .withArgs(this.user);
        });

        it('relayed call (with role): success', async function () {
          await this.manager.connect(this.user).execute(this.ownable, this.ownable.$_checkOwner.getFragment().selector);
        });

        it('relayed call (without role): success', async function () {
          await this.manager
            .connect(this.other)
            .execute(this.ownable, this.ownable.$_checkOwner.getFragment().selector);
        });
      });
    });
  });
}

// ============ ENUMERABLE EXTENSION ============

/**
 * @requires this.{manager,roles,admin,user,other,target,target2}
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
        const members = Array.from({ length: Number(memberCount) }, (_, i) =>
          this.manager.getRoleMember(ANOTHER_ROLE, i),
        );

        expect(memberCount).to.equal(expectedMembers.length);
        await expect(Promise.all(members)).to.eventually.deep.equal(expectedMembers);

        // Test batch enumeration
        await expect(this.manager.getRoleMembers(ANOTHER_ROLE, 0, ethers.MaxUint256)).to.eventually.deep.equal(
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
        const target = this.target;
        const selectors = ['someFunction()', 'anotherFunction(uint256)', 'thirdFunction(address,bool)'].map(selector);

        await this.manager.connect(this.admin).setTargetFunctionRole(target, selectors, roleId);

        const functionCount = await this.manager.getRoleTargetFunctionCount(roleId, target);
        const functions = Array.from({ length: Number(functionCount) }, (_, i) =>
          this.manager.getRoleTargetFunction(roleId, target, i),
        );

        expect(functionCount).to.equal(selectors.length);
        await expect(Promise.all(functions)).to.eventually.have.members(selectors);

        // Test batch enumeration
        await expect(
          this.manager.getRoleTargetFunctions(roleId, target, 0, ethers.MaxUint256),
        ).to.eventually.deep.equal(selectors);
      });

      it('target function enumeration updates when roles change', async function () {
        const roleId1 = this.roles.SOME.id;
        const roleId2 = this.roles.SOME_ADMIN.id;
        const target = this.target;
        const sel = selector('testFunction()');

        // Initially assign to roleId1
        await this.manager.connect(this.admin).setTargetFunctionRole(target, [sel], roleId1);

        await expect(this.manager.getRoleTargetFunctionCount(roleId1, target)).to.eventually.equal(1);
        await expect(this.manager.getRoleTargetFunctionCount(roleId2, target)).to.eventually.equal(0);
        await expect(this.manager.getRoleTargetFunction(roleId1, target, 0)).to.eventually.equal(sel);

        // Reassign to roleId2
        await this.manager.connect(this.admin).setTargetFunctionRole(target, [sel], roleId2);

        await expect(this.manager.getRoleTargetFunctionCount(roleId1, target)).to.eventually.equal(0);
        await expect(this.manager.getRoleTargetFunctionCount(roleId2, target)).to.eventually.equal(1);
        await expect(this.manager.getRoleTargetFunction(roleId2, target, 0)).to.eventually.equal(sel);
      });

      it('returns empty for ADMIN_ROLE target functions', async function () {
        const target = this.target;
        const sel = selector('adminFunction()');

        // Set function to ADMIN_ROLE (default behavior)
        await this.manager.connect(this.admin).setTargetFunctionRole(target, [sel], this.roles.ADMIN.id);

        // ADMIN_ROLE functions are not tracked
        await expect(this.manager.getRoleTargetFunctionCount(this.roles.ADMIN.id, target)).to.eventually.equal(0);
        await expect(
          this.manager.getRoleTargetFunctions(this.roles.ADMIN.id, target, 0, ethers.MaxUint256),
        ).to.eventually.deep.equal([]);
      });

      it('returns empty for roles with no target functions', async function () {
        const roleId = 888n; // Role with no functions
        const target = this.target;

        await expect(this.manager.getRoleTargetFunctionCount(roleId, target)).to.eventually.equal(0);
        await expect(
          this.manager.getRoleTargetFunctions(roleId, target, 0, ethers.MaxUint256),
        ).to.eventually.deep.equal([]);
      });

      it('supports partial enumeration of target functions', async function () {
        const roleId = this.roles.SOME.id;
        const target = this.target;
        const selectors = ['func1()', 'func2()', 'func3()', 'func4()'].map(selector);

        await this.manager.connect(this.admin).setTargetFunctionRole(target, selectors, roleId);

        await expect(this.manager.getRoleTargetFunctionCount(roleId, target)).to.eventually.equal(4);

        // Test partial enumeration
        const firstTwo = await this.manager.getRoleTargetFunctions(roleId, target, 0, 2);
        expect(firstTwo).to.have.lengthOf(2);
        expect(selectors).to.include.members(firstTwo);

        const lastTwo = await this.manager.getRoleTargetFunctions(roleId, target, 2, 4);
        expect(lastTwo).to.have.lengthOf(2);
        expect(selectors).to.include.members(firstTwo);

        // Verify no overlap and complete coverage
        expect([].concat(firstTwo, lastTwo)).to.have.members(selectors);
      });

      it('distinguishes between different targets', async function () {
        const roleId = this.roles.SOME.id;
        const target1 = this.target;
        const target2 = this.target2;
        const sel1 = selector('target1Function()');
        const sel2 = selector('target2Function()');

        // Set different functions for the same role on different targets
        await this.manager.connect(this.admin).setTargetFunctionRole(target1, [sel1], roleId);
        await this.manager.connect(this.admin).setTargetFunctionRole(target2, [sel2], roleId);

        // Each target should have its own function tracked
        await expect(this.manager.getRoleTargetFunctionCount(roleId, target1)).to.eventually.equal(1);
        await expect(this.manager.getRoleTargetFunctionCount(roleId, target2)).to.eventually.equal(1);

        await expect(this.manager.getRoleTargetFunction(roleId, target1, 0)).to.eventually.equal(sel1);
        await expect(this.manager.getRoleTargetFunction(roleId, target2, 0)).to.eventually.equal(sel2);

        // Functions should be isolated per target
        await expect(
          this.manager.getRoleTargetFunctions(roleId, target1, 0, ethers.MaxUint256),
        ).to.eventually.deep.equal([sel1]);
        await expect(
          this.manager.getRoleTargetFunctions(roleId, target2, 0, ethers.MaxUint256),
        ).to.eventually.deep.equal([sel2]);
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
  shouldBehaveLikeAccessManager,
  shouldBehaveLikeAccessManagerEnumerable,
};
