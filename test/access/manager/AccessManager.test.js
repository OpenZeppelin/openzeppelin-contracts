const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const { MAX_UINT48 } = require('../../helpers/constants');
const { selector } = require('../../helpers/methods');
const time = require('../../helpers/time');

const {
  buildBaseRoles,
  formatAccess,
  EXPIRATION,
  MINSETBACK,
  EXECUTION_ID_STORAGE_SLOT,
  CONSUMING_SCHEDULE_STORAGE_SLOT,
  prepareOperation,
  hashOperation,
} = require('../../helpers/access-manager');

const {
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeNotDelayedAdminOperation,
  shouldBehaveLikeRoleAdminOperation,
  shouldBehaveLikeAManagedRestrictedOperation,
} = require('./AccessManager.behavior');

const {
  LIKE_COMMON_SCHEDULABLE,
  testAsClosable,
  testAsDelay,
  testAsSchedulableOperation,
  testAsCanCall,
  testAsHasRole,
  testAsGetAccess,
} = require('./AccessManager.predicate');

async function fixture() {
  const [admin, roleAdmin, roleGuardian, member, user, other] = await ethers.getSigners();

  // Build roles
  const roles = buildBaseRoles();

  // Add members
  roles.ADMIN.members = [admin];
  roles.SOME_ADMIN.members = [roleAdmin];
  roles.SOME_GUARDIAN.members = [roleGuardian];
  roles.SOME.members = [member];
  roles.PUBLIC.members = [admin, roleAdmin, roleGuardian, member, user, other];

  const manager = await ethers.deployContract('$AccessManager', [admin]);
  const target = await ethers.deployContract('$AccessManagedTarget', [manager]);

  for (const { id: roleId, admin, guardian, members } of Object.values(roles)) {
    if (roleId === roles.PUBLIC.id) continue; // Every address belong to public and is locked
    if (roleId === roles.ADMIN.id) continue; // Admin set during construction and is locked

    // Set admin role avoiding default
    if (admin.id !== roles.ADMIN.id) {
      await manager.$_setRoleAdmin(roleId, admin.id);
    }

    // Set guardian role avoiding default
    if (guardian.id !== roles.ADMIN.id) {
      await manager.$_setRoleGuardian(roleId, guardian.id);
    }

    // Grant role to members
    for (const member of members) {
      await manager.$_grantRole(roleId, member, 0, 0);
    }
  }

  return {
    admin,
    roleAdmin,
    user,
    other,
    roles,
    manager,
    target,
  };
}

// This test suite is made using the following tools:
//
// * Predicates: Functions with common conditional setups without assertions.
// * Behaviors: Functions with common assertions.
//
// The behavioral tests are built by composing predicates and are used as templates
// for testing access to restricted functions.
//
// Similarly, unit tests in this suite will use predicates to test subsets of these
// behaviors and are helped by common assertions provided for some of the predicates.
//
// The predicates can be identified by the `testAs*` prefix while the behaviors
// are prefixed with `shouldBehave*`. The common assertions for predicates are
// defined as constants.
describe('AccessManager', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('during construction', function () {
    it('grants admin role to initialAdmin', async function () {
      const manager = await ethers.deployContract('$AccessManager', [this.other]);
      expect(await manager.hasRole(this.roles.ADMIN.id, this.other).then(formatAccess)).to.be.deep.equal([true, '0']);
    });

    it('rejects zero address for initialAdmin', async function () {
      await expect(ethers.deployContract('$AccessManager', [ethers.ZeroAddress]))
        .to.be.revertedWithCustomError(this.manager, 'AccessManagerInvalidInitialAdmin')
        .withArgs(ethers.ZeroAddress);
    });

    it('initializes setup roles correctly', async function () {
      for (const { id: roleId, admin, guardian, members } of Object.values(this.roles)) {
        expect(await this.manager.getRoleAdmin(roleId)).to.equal(admin.id);
        expect(await this.manager.getRoleGuardian(roleId)).to.equal(guardian.id);

        for (const user of this.roles.PUBLIC.members) {
          expect(await this.manager.hasRole(roleId, user).then(formatAccess)).to.be.deep.equal([
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
        expect(await this.manager.expiration()).to.equal(EXPIRATION);
      });
    });

    describe('#minSetback', function () {
      it('has a 5 days default minimum setback', async function () {
        expect(await this.manager.minSetback()).to.equal(MINSETBACK);
      });
    });

    describe('#isTargetClosed', function () {
      testAsClosable({
        closed() {
          it('returns true', async function () {
            expect(await this.manager.isTargetClosed(this.target)).to.be.true;
          });
        },
        open() {
          it('returns false', async function () {
            expect(await this.manager.isTargetClosed(this.target)).to.be.false;
          });
        },
      });
    });

    describe('#getTargetFunctionRole', function () {
      const methodSelector = selector('something(address,bytes)');

      it('returns the target function role', async function () {
        const roleId = 21498n;
        await this.manager.$_setTargetFunctionRole(this.target, methodSelector, roleId);

        expect(await this.manager.getTargetFunctionRole(this.target, methodSelector)).to.equal(roleId);
      });

      it('returns the ADMIN role if not set', async function () {
        expect(await this.manager.getTargetFunctionRole(this.target, methodSelector)).to.equal(this.roles.ADMIN.id);
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
              expect(await this.manager.getTargetAdminDelay(this.target)).to.equal(this.oldDelay);
            });
          },
          after: function self() {
            self.mineDelay = true;

            it('returns the new target admin delay', async function () {
              expect(await this.manager.getTargetAdminDelay(this.target)).to.equal(this.newDelay);
            });
          },
        });
      });

      it('returns the 0 if not set', async function () {
        expect(await this.manager.getTargetAdminDelay(this.target)).to.equal(0n);
      });
    });

    describe('#getRoleAdmin', function () {
      const roleId = 5234907n;

      it('returns the role admin', async function () {
        const adminId = 789433n;

        await this.manager.$_setRoleAdmin(roleId, adminId);

        expect(await this.manager.getRoleAdmin(roleId)).to.equal(adminId);
      });

      it('returns the ADMIN role if not set', async function () {
        expect(await this.manager.getRoleAdmin(roleId)).to.equal(this.roles.ADMIN.id);
      });
    });

    describe('#getRoleGuardian', function () {
      const roleId = 5234907n;

      it('returns the role guardian', async function () {
        const guardianId = 789433n;

        await this.manager.$_setRoleGuardian(roleId, guardianId);

        expect(await this.manager.getRoleGuardian(roleId)).to.equal(guardianId);
      });

      it('returns the ADMIN role if not set', async function () {
        expect(await this.manager.getRoleGuardian(roleId)).to.equal(this.roles.ADMIN.id);
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
              expect(await this.manager.getRoleGrantDelay(roleId)).to.equal(this.oldDelay);
            });
          },
          after: function self() {
            self.mineDelay = true;

            it('returns the new role grant delay', async function () {
              expect(await this.manager.getRoleGrantDelay(roleId)).to.equal(this.newDelay);
            });
          },
        });
      });

      it('returns 0 if delay is not set', async function () {
        expect(await this.manager.getTargetAdminDelay(this.target)).to.equal(0n);
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
                  expect(await time.clock.timestamp()).to.lt(access[0]);
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
                  expect(await time.clock.timestamp()).to.equal(access[0]);
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
                  expect(await time.clock.timestamp()).to.lt(access[0]);
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
                  expect(await time.clock.timestamp()).to.equal(access[0]);
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
                expect(await time.clock.timestamp()).to.equal(access[0]);
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
                expect(await time.clock.timestamp()).to.equal(access[0]);
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
              expect(await this.manager.getSchedule(this.operationId)).to.equal(0n);
            });
          },
        },
        notScheduled() {
          it('defaults to 0', async function () {
            expect(await this.manager.getSchedule(this.operationId)).to.equal(0n);
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
          expect(await this.manager.getNonce(this.operationId)).to.equal(1n);
        });
      });

      describe('when is not scheduled', function () {
        it('returns default 0', async function () {
          expect(await this.manager.getNonce(ethers.id('operation'))).to.equal(0n);
        });
      });
    });

    describe('#hashOperation', function () {
      it('returns an operationId', async function () {
        const args = [this.user, this.other, '0x123543'];
        expect(await this.manager.hashOperation(...args)).to.equal(hashOperation(...args));
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
          expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.equal(this.roles.SOME_ADMIN.id);

          await expect(this.manager.connect(this.admin).setRoleAdmin(this.roles.SOME.id, this.roles.ADMIN.id))
            .to.emit(this.manager, 'RoleAdminChanged')
            .withArgs(this.roles.SOME.id, this.roles.ADMIN.id);

          expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.equal(this.roles.ADMIN.id);
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
          expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.equal(this.roles.SOME_GUARDIAN.id);

          await expect(this.manager.connect(this.admin).setRoleGuardian(this.roles.SOME.id, this.roles.ADMIN.id))
            .to.emit(this.manager, 'RoleGuardianChanged')
            .withArgs(this.roles.SOME.id, this.roles.ADMIN.id);

          expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.equal(this.roles.ADMIN.id);
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
            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(oldDelay);
          });

          it('increases the delay after minsetback', async function () {
            const txResponse = await this.manager.connect(this.admin).setGrantDelay(this.role.id, newDelay);
            const setGrantDelayAt = await time.clockFromReceipt.timestamp(txResponse);
            await expect(txResponse)
              .to.emit(this.manager, 'RoleGrantDelayChanged')
              .withArgs(this.role.id, newDelay, setGrantDelayAt + MINSETBACK);

            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(newDelay);
          });
        });

        describe('when reducing the delay', function () {
          const oldDelay = time.duration.days(10);

          beforeEach('sets old delay', async function () {
            this.role = this.roles.SOME;
            await this.manager.$_setGrantDelay(this.role.id, oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(oldDelay);
          });

          describe('when the delay difference is shorter than minimum setback', function () {
            const newDelay = oldDelay - 1n;

            it('increases the delay after minsetback', async function () {
              const txResponse = await this.manager.connect(this.admin).setGrantDelay(this.role.id, newDelay);
              const setGrantDelayAt = await time.clockFromReceipt.timestamp(txResponse);
              await expect(txResponse)
                .to.emit(this.manager, 'RoleGrantDelayChanged')
                .withArgs(this.role.id, newDelay, setGrantDelayAt + MINSETBACK);

              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(oldDelay);
              await time.increaseBy.timestamp(MINSETBACK);
              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(newDelay);
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

              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(oldDelay);
              await time.increaseBy.timestamp(setback);
              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.equal(newDelay);
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
            expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(oldDelay);
          });

          it('increases the delay after minsetback', async function () {
            const txResponse = await this.manager.connect(this.admin).setTargetAdminDelay(this.other, newDelay);
            const setTargetAdminDelayAt = await time.clockFromReceipt.timestamp(txResponse);
            await expect(txResponse)
              .to.emit(this.manager, 'TargetAdminDelayUpdated')
              .withArgs(this.other, newDelay, setTargetAdminDelayAt + MINSETBACK);

            expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(newDelay);
          });
        });

        describe('when reducing the delay', function () {
          const oldDelay = time.duration.days(10);

          beforeEach('sets old delay', async function () {
            await this.manager.$_setTargetAdminDelay(this.other, oldDelay);
            await time.increaseBy.timestamp(MINSETBACK);
            expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(oldDelay);
          });

          describe('when the delay difference is shorter than minimum setback', function () {
            const newDelay = oldDelay - 1n;

            it('increases the delay after minsetback', async function () {
              const txResponse = await this.manager.connect(this.admin).setTargetAdminDelay(this.other, newDelay);
              const setTargetAdminDelayAt = await time.clockFromReceipt.timestamp(txResponse);
              await expect(txResponse)
                .to.emit(this.manager, 'TargetAdminDelayUpdated')
                .withArgs(this.other, newDelay, setTargetAdminDelayAt + MINSETBACK);

              expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(oldDelay);
              await time.increaseBy.timestamp(MINSETBACK);
              expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(newDelay);
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

              expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(oldDelay);
              await time.increaseBy.timestamp(setback);
              expect(await this.manager.getTargetAdminDelay(this.other)).to.equal(newDelay);
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
          expect(await this.newManagedTarget.authority()).to.equal(this.manager);

          await expect(this.manager.connect(this.admin).updateAuthority(this.newManagedTarget, this.newAuthority))
            .to.emit(this.newManagedTarget, 'AuthorityUpdated') // Managed contract is responsible of notifying the change through an event
            .withArgs(this.newAuthority);

          expect(await this.newManagedTarget.authority()).to.equal(this.newAuthority);
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
          expect(await this.manager.isTargetClosed(this.target)).to.be.true;

          await expect(this.manager.connect(this.admin).setTargetClosed(this.target, false))
            .to.emit(this.manager, 'TargetClosed')
            .withArgs(this.target, false);
          expect(await this.manager.isTargetClosed(this.target)).to.be.false;
        });

        it('reverts if closing the manager', async function () {
          await expect(this.manager.connect(this.admin).setTargetClosed(this.manager, true))
            .to.be.revertedWithCustomError(this.manager, 'AccessManagerLockedAccount')
            .withArgs(this.manager);
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
            expect(await this.manager.getTargetFunctionRole(this.target, sig)).to.equal(this.roles.ADMIN.id);
          }

          const allowRole = await this.manager
            .connect(this.admin)
            .setTargetFunctionRole(this.target, sigs, this.roles.SOME.id);

          for (const sig of sigs) {
            await expect(allowRole)
              .to.emit(this.manager, 'TargetFunctionRoleUpdated')
              .withArgs(this.target, sig, this.roles.SOME.id);
            expect(await this.manager.getTargetFunctionRole(this.target, sig)).to.equal(this.roles.SOME.id);
          }

          await expect(
            this.manager.connect(this.admin).setTargetFunctionRole(this.target, [sigs[1]], this.roles.SOME_ADMIN.id),
          )
            .to.emit(this.manager, 'TargetFunctionRoleUpdated')
            .withArgs(this.target, sigs[1], this.roles.SOME_ADMIN.id);

          for (const sig of sigs) {
            expect(await this.manager.getTargetFunctionRole(this.target, sig)).to.equal(
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
                expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                  false,
                  '0',
                ]);

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
                    expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                      false,
                      this.executionDelay.toString(),
                    ]);
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
                    expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                      true,
                      this.executionDelay.toString(),
                    ]);
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
                expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                  false,
                  '0',
                ]);
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
                expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                  true,
                  executionDelay.toString(),
                ]);
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
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);

                  this.newExecutionDelay = this.previousExecutionDelay + time.duration.days(4);
                });

                it('emits event and immediately changes the execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);
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
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.newExecutionDelay.toString(),
                  ]);
                });
              });

              describe('when decreasing the execution delay', function () {
                beforeEach('decrease execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);

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
                      expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                        true,
                        this.previousExecutionDelay.toString(),
                      ]);
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
                      expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                        true,
                        this.newExecutionDelay.toString(),
                      ]);
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
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);

                  this.newExecutionDelay = this.previousExecutionDelay + time.duration.days(4);
                });

                it('emits event and immediately changes the execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);
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
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.newExecutionDelay.toString(),
                  ]);
                });
              });

              describe('when decreasing the execution delay', function () {
                beforeEach('decrease execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);

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
                      expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                        true,
                        this.previousExecutionDelay.toString(),
                      ]);
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
                      expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                        true,
                        this.newExecutionDelay.toString(),
                      ]);
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
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    false,
                    '0',
                  ]);

                  await expect(this.manager.connect(this.admin).revokeRole(ANOTHER_ROLE, this.user))
                    .to.emit(this.manager, 'RoleRevoked')
                    .withArgs(ANOTHER_ROLE, this.user);

                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    false,
                    '0',
                  ]);

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
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    '0',
                  ]);

                  await expect(this.manager.connect(this.admin).revokeRole(ANOTHER_ROLE, this.user))
                    .to.emit(this.manager, 'RoleRevoked')
                    .withArgs(ANOTHER_ROLE, this.user);

                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    false,
                    '0',
                  ]);

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
              expect(await this.manager.hasRole(this.roles.SOME.id, this.user).then(formatAccess)).to.be.deep.equal([
                false,
                '0',
              ]);
              await expect(this.manager.connect(this.roleAdmin).revokeRole(this.roles.SOME.id, this.user)).to.not.emit(
                this.manager,
                'RoleRevoked',
              );
              expect(await this.manager.hasRole(this.roles.SOME.id, this.user).then(formatAccess)).to.be.deep.equal([
                false,
                '0',
              ]);
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
            expect(await this.manager.hasRole(this.role.id, this.caller).then(formatAccess)).to.be.deep.equal([
              true,
              '0',
            ]);
            await expect(this.manager.connect(this.caller).renounceRole(this.role.id, this.caller))
              .to.emit(this.manager, 'RoleRevoked')
              .withArgs(this.role.id, this.caller);
            expect(await this.manager.hasRole(this.role.id, this.caller).then(formatAccess)).to.be.deep.equal([
              false,
              '0',
            ]);
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

  describe('access managed target operations', function () {
    describe('when calling a restricted target function', function () {
      beforeEach('set required role', function () {
        this.method = this.target.fnRestricted.getFragment();
        this.role = { id: 3597243n };
        this.manager.$_setTargetFunctionRole(this.target, this.method.selector, this.role.id);
      });

      describe('restrictions', function () {
        beforeEach('set method and args', function () {
          this.calldata = this.target.interface.encodeFunctionData(this.method, []);
          this.caller = this.user;
        });

        shouldBehaveLikeAManagedRestrictedOperation();
      });

      it('succeeds called by a role member', async function () {
        await this.manager.$_grantRole(this.role.id, this.user, 0, 0);

        await expect(
          this.target.connect(this.user)[this.method.selector]({
            data: this.calldata,
          }),
        )
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
        await expect(
          this.target.connect(this.user)[method]({
            data: this.calldata,
          }),
        )
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

      expect(await this.manager.getSchedule(operationId)).to.equal(scheduledAt + this.delay);
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

      expect(await this.manager.getSchedule(operationId)).to.equal(scheduledAt + executionDelay);
      await expect(txResponse)
        .to.emit(this.manager, 'OperationScheduled')
        .withArgs(operationId, '1', scheduledAt + executionDelay, this.caller, this.target, this.calldata);
    });

    it('increases the nonce of an operation scheduled more than once', async function () {
      // Setup and check initial nonce
      const expectedOperationId = hashOperation(this.caller, this.target, this.calldata);
      expect(await this.manager.getNonce(expectedOperationId)).to.equal('0');

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
      expect(await this.manager.getNonce(expectedOperationId)).to.equal('1');

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
      expect(await this.manager.getNonce(expectedOperationId)).to.equal('2');
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

      expect(await this.manager.getSchedule(operationId)).to.equal(0n);
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

      expect(await this.manager.getSchedule(operationId)).to.equal(0n);
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
              expect(await this.manager.getSchedule(this.operationId)).to.equal(this.scheduledAt + this.scheduleIn);

              await expect(this.manager.connect(this.caller).consumeScheduledOp(this.caller, this.calldata))
                .to.emit(this.manager, 'OperationExecuted')
                .withArgs(this.operationId, 1n);
              expect(await this.manager.getSchedule(this.operationId)).to.equal(0n);
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
      expect(await this.manager.getSchedule(operationId)).to.equal('0');
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
      expect(await this.ownable.owner()).to.equal(this.manager);
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
});
