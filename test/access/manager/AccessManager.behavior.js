const { time } = require('@openzeppelin/test-helpers');
const {
  time: { setNextBlockTimestamp },
  setStorageAt,
  mine,
} = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../../helpers/account');
const { expectRevertCustomError } = require('../../helpers/customError');
const { EXPIRATION } = require('../../helpers/access-manager');

// ============ DELAY HELPERS ============

/**
 * @requires this.{delay}
 */
function shouldBehaveLikeDelay(type, { on: { before, after } }) {
  describe(`when ${type} delay has not passed`, function () {
    beforeEach(`set ${type} delay passed`, async function () {
      const timestamp = await time.latest();
      await setNextBlockTimestamp(timestamp.add(this.delay).subn(1));
    });

    before.call(this);
  });

  describe(`when ${type} delay has passed`, function () {
    beforeEach(`set ${type} delay passed`, async function () {
      const timestamp = await time.latest();
      await setNextBlockTimestamp(timestamp.add(this.delay));
    });

    after.call(this);
  });
}

// ============ OPERATION HELPERS ============

/**
 * @requires this.{manager,delayedUntil}
 */
function shouldBehaveLikeDelayedOperation({
  on: {
    scheduled: { before, after, expired },
    notScheduled,
  },
}) {
  describe('when operation is scheduled', function () {
    beforeEach('schedule operation', async function () {
      this.delay = this.delayedUntil;
      const { operationId } = await scheduleOperation.call(this);
      this.operationId = operationId;
    });

    describe('when execution time has not passed', function () {
      beforeEach('set execution time not passed', async function () {
        const schedule = await this.manager.getSchedule(this.operationId);
        await setNextBlockTimestamp(schedule.subn(1));
      });

      before.call(this);
    });

    describe('when execution time has passed', function () {
      beforeEach('set execution time passed', async function () {
        const schedule = await this.manager.getSchedule(this.operationId);
        await setNextBlockTimestamp(schedule);
      });

      after.call(this);
    });

    describe('when execution time has expired', function () {
      beforeEach('set execution time expired', async function () {
        const schedule = await this.manager.getSchedule(this.operationId);
        await setNextBlockTimestamp(schedule.add(EXPIRATION));
      });

      expired.call(this);
    });
  });

  describe('when operation is not scheduled', function () {
    beforeEach('set expected operationId', async function () {
      this.operationId = await this.manager.hashOperation(this.caller, this.target, this.calldata);
    });

    beforeEach('assert operation is not scheduled', async function () {
      expect(await this.manager.getSchedule(this.operationId)).to.be.bignumber.equal(web3.utils.toBN(0));
    });

    notScheduled.call(this);
  });
}

// ============ METHOD HELPERS ============

/**
 * @requires this.{manager,roles}
 */
function shouldBehaveLikeCanCallSelf({
  on: {
    managerCaller: { executing, notExecuting },
    externalCaller,
  },
}) {
  beforeEach('set target as manager', function () {
    this.target = this.manager.address;
  });

  describe('when caller is the manager', function () {
    beforeEach('set caller as manager', async function () {
      this.caller = this.manager.address;
      await impersonate(this.caller);
    });

    shouldBehaveLikeCanCallExecuting.call(this, {
      on: { executing, notExecuting },
    });
  });

  describe('when caller is not the manager', function () {
    beforeEach('set non manager caller', function () {
      this.caller = this.roles.SOME.members[0];
    });

    externalCaller.call(this);
  });
}

/**
 * @requires this.{target,calldata}
 */
function shouldBehaveLikeCanCallExecuting({ on: { executing, notExecuting } }) {
  describe('when is executing', function () {
    beforeEach('set _executionId flag from calldata and target', async function () {
      const executionId = await web3.utils.keccak256(
        web3.eth.abi.encodeParameters(['address', 'bytes4'], [this.target, this.calldata.substring(0, 10)]),
      );
      await setStorageAt(this.target, 3, executionId);
    });

    executing.call(this);
  });

  describe('when is not executing', notExecuting);
}

/**
 * @requires this.{target,calldata,roles,role}
 */
function shouldBehaveLikeHasRole({ on: { requiredPublicRole, notRequiredPublicRole } }) {
  describe('when required role is PUBLIC_ROLE', function () {
    beforeEach('set required role as PUBLIC_ROLE', async function () {
      await this.manager.$_setTargetFunctionRole(this.target, this.calldata.substring(0, 10), this.roles.PUBLIC.id, {
        from: this.roles.ADMIN.members[0],
      });
    });

    requiredPublicRole.call(this);
  });

  describe('when required role is not PUBLIC_ROLE', function () {
    beforeEach('set required role', async function () {
      await this.manager.$_setTargetFunctionRole(this.target, this.calldata.substring(0, 10), this.role.id, {
        from: this.roles.ADMIN.members[0],
      });
    });

    shouldBehaveLikeGetAccess.call(this, {
      on: notRequiredPublicRole,
    });
  });
}

/**
 * @requires this.{manager,role,caller}
 */
function shouldBehaveLikeGetAccess({
  on: {
    roleGranted: {
      roleWithGrantDelay: { callerWithExecutionDelay: case1, callerWithoutExecutionDelay: case2 },
      roleWithoutGrantDelay: { callerWithExecutionDelay: case3, callerWithoutExecutionDelay: case4 },
    },
    roleNotGranted,
  },
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

        shouldBehaveLikeDelay.call(this, 'grant', {
          on: case1,
        });
      });

      describe('without caller execution delay', function () {
        beforeEach('set role and delays', async function () {
          this.delay = this.grantDelay;
          this.executionDelay = 0;
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
        });

        shouldBehaveLikeDelay.call(this, 'grant', {
          on: case2,
        });
      });
    });

    describe('without grant delay', function () {
      beforeEach('set delay', function () {
        this.grantDelay = 0;
      });

      describe('with caller execution delay', function () {
        beforeEach('set role and delay', async function () {
          this.executionDelay = time.duration.hours(10);
          await this.manager.$_grantRole(this.role.id, this.caller, this.grantDelay, this.executionDelay);
          this.delayedUntil = this.executionDelay;
        });

        shouldBehaveLikeDelayedOperation.call(this, {
          on: case3,
        });
      });

      describe('without caller execution delay', function () {
        beforeEach('set role and delay ', async function () {
          this.executionDelay = 0;
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
function shouldBehaveLikeAnAdminOperation({ on: { externalCaller } }) {
  shouldBehaveLikeCanCallSelf({
    on: {
      managerCaller: {
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
      },
      externalCaller,
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeOptionallyDelayedAdminOperation({
  on: {
    externalCaller: {
      notRequiredPublicRole: {
        roleGranted: {
          roleWithGrantDelay: {
            callerWithExecutionDelay: { after },
          },
        },
      },
    },
  },
}) {
  shouldBehaveLikeAnAdminOperation({
    on: {
      externalCaller: function () {
        shouldBehaveLikeHasRole({
          on: {
            requiredPublicRole: function () {
              it('reverts as AccessManagerUnauthorizedAccount', async function () {
                await expectRevertCustomError(callMethod.call(this), 'AccessManagerUnauthorizedAccount', [
                  this.caller,
                  this.role.id,
                ]);
              });
            },
            notRequiredPublicRole: {
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
                    after: function () {
                      beforeEach('consume previously set grant delay', async function () {
                        // Consume previously set delay
                        await mine();
                      });

                      after.call(this);
                    },
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
                  callerWithExecutionDelay: {
                    scheduled: {
                      before: function () {
                        it('reverts as AccessManagerNotReady', async function () {
                          await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotReady', [
                            this.operationId,
                          ]);
                        });
                      },
                      after: function () {
                        it('succeeds', function () {
                          callMethod.call(this);
                        });
                      },
                      expired: function () {
                        it('reverts as AccessManagerExpired', async function () {
                          await expectRevertCustomError(callMethod.call(this), 'AccessManagerExpired', [
                            this.operationId,
                          ]);
                        });
                      },
                    },
                    notScheduled: function () {
                      it('reverts as AccessManagerNotScheduled', async function () {
                        await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotScheduled', [
                          this.operationId,
                        ]);
                      });
                    },
                  },
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
            },
          },
        });
      },
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeDelayedAdminOperation() {
  shouldBehaveLikeOptionallyDelayedAdminOperation({
    on: {
      externalCaller: {
        notRequiredPublicRole: {
          roleGranted: {
            roleWithGrantDelay: {
              callerWithExecutionDelay: {
                after: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  describe('with operation delay', function () {
                    describe('when operation delay is greater than execution delay', function () {
                      beforeEach('set operation delay', async function () {
                        this.operationDelay = this.executionDelay.add(time.duration.hours(1));
                        await this.manager.$_setTargetAdminDelay(this.target, this.operationDelay);

                        this.delayedUntil = this.operationDelay;
                      });

                      shouldBehaveLikeDelayedOperation.call(this, {
                        on: {
                          scheduled: {
                            before: function () {
                              it('reverts as AccessManagerNotReady', async function () {
                                await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotReady', [
                                  this.operationId,
                                ]);
                              });
                            },
                            after: function () {
                              it('succeeds', async function () {
                                callMethod.call(this);
                              });
                            },
                            expired: function () {
                              it('reverts as AccessManagerExpired', async function () {
                                await expectRevertCustomError(callMethod.call(this), 'AccessManagerExpired', [
                                  this.operationId,
                                ]);
                              });
                            },
                          },
                          notScheduled: function () {
                            it('reverts as AccessManagerNotScheduled', async function () {
                              await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotScheduled', [
                                this.operationId,
                              ]);
                            });
                          },
                        },
                      });
                    });

                    describe('when operation delay is shorter than execution delay', function () {
                      beforeEach('set operation delay', async function () {
                        this.operationDelay = this.executionDelay.sub(time.duration.hours(1));
                        await this.manager.$_setTargetAdminDelay(this.target, this.operationDelay);

                        this.delayedUntil = this.executionDelay;
                      });

                      shouldBehaveLikeDelayedOperation.call(this, {
                        on: {
                          scheduled: {
                            before: function () {
                              it('reverts as AccessManagerNotReady', async function () {
                                await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotReady', [
                                  this.operationId,
                                ]);
                              });
                            },
                            after: function () {
                              it('succeeds', async function () {
                                await callMethod.call(this);
                              });
                            },
                            expired: function () {
                              it('reverts as AccessManagerExpired', async function () {
                                await expectRevertCustomError(callMethod.call(this), 'AccessManagerExpired', [
                                  this.operationId,
                                ]);
                              });
                            },
                          },
                          notScheduled: function () {
                            it('reverts as AccessManagerNotScheduled', async function () {
                              await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotScheduled', [
                                this.operationId,
                              ]);
                            });
                          },
                        },
                      });
                    });
                  });

                  describe('without operation delay', function () {
                    beforeEach('set operation delay', async function () {
                      this.operationDelay = 0;
                      await this.manager.$_setTargetAdminDelay(this.target, this.operationDelay);
                      this.delayedUntil = this.executionDelay;
                    });

                    shouldBehaveLikeDelayedOperation.call(this, {
                      on: {
                        scheduled: {
                          before: function () {
                            it('reverts as AccessManagerNotReady', async function () {
                              await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotReady', [
                                this.operationId,
                              ]);
                            });
                          },
                          after: function () {
                            it('succeeds', async function () {
                              await callMethod.call(this);
                            });
                          },
                          expired: function () {
                            it('reverts as AccessManagerExpired', async function () {
                              await expectRevertCustomError(callMethod.call(this), 'AccessManagerExpired', [
                                this.operationId,
                              ]);
                            });
                          },
                        },
                        notScheduled: function () {
                          it('reverts as AccessManagerNotScheduled', async function () {
                            await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotScheduled', [
                              this.operationId,
                            ]);
                          });
                        },
                      },
                    });
                  });
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * @requires this.{manager,roles,calldata,role}
 */
function shouldBehaveLikeNotDelayedAdminOperation() {
  shouldBehaveLikeOptionallyDelayedAdminOperation({
    on: {
      externalCaller: {
        notRequiredPublicRole: {
          roleGranted: {
            roleWithGrantDelay: {
              callerWithExecutionDelay: {
                after: function () {
                  beforeEach('set operation delay', function () {
                    this.delayedUntil = this.executionDelay;
                  });

                  shouldBehaveLikeDelayedOperation.call(this, {
                    on: {
                      scheduled: {
                        before: function () {
                          it('reverts as AccessManagerNotReady', async function () {
                            await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotReady', [
                              this.operationId,
                            ]);
                          });
                        },
                        after: function () {
                          it('succeeds', async function () {
                            await callMethod.call(this);
                          });
                        },
                        expired: function () {
                          it('reverts as AccessManagerExpired', async function () {
                            await expectRevertCustomError(callMethod.call(this), 'AccessManagerExpired', [
                              this.operationId,
                            ]);
                          });
                        },
                      },
                      notScheduled: function () {
                        it('reverts as AccessManagerNotScheduled', async function () {
                          await expectRevertCustomError(callMethod.call(this), 'AccessManagerNotScheduled', [
                            this.operationId,
                          ]);
                        });
                      },
                    },
                  });
                },
              },
            },
          },
        },
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
  await this.manager.schedule(this.target, this.calldata, nextTimestamp.add(this.delay), {
    from: this.caller,
  });

  return {
    operationId: await this.manager.hashOperation(this.caller, this.target, this.calldata),
  };
}

/**
 * @requires this.{manager, calldata, caller}
 */
function callMethod() {
  return this.manager.sendTransaction({ data: this.calldata, from: this.caller });
}

module.exports = {
  shouldBehaveLikeAnAdminOperation,
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeNotDelayedAdminOperation,
};
