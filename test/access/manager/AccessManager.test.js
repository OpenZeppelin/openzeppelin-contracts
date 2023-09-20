const { web3 } = require('hardhat');
const { constants, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { selector } = require('../../helpers/methods');
const { clockFromReceipt } = require('../../helpers/time');
const { buildBaseRoles, formatAccess, EXPIRATION, MINSETBACK } = require('../../helpers/access-manager');
const { product } = require('../../helpers/iterate');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const {
  // MODE HELPERS
  shouldBehaveLikeClosable,
  // DELAY HELPERS
  shouldBehaveLikeDelay,
  // METHOD HELPERS
  shouldBehaveLikeGetAccess,
  shouldBehaveLikeHasRole,
  // ADMIN OPERATION HELPERS
  shouldBehaveLikeDelayedAdminOperation,
  shouldBehaveLikeNotDelayedAdminOperation,
} = require('./AccessManager.behavior');
const { default: Wallet } = require('ethereumjs-wallet');
const { mine } = require('@nomicfoundation/hardhat-network-helpers');

const AccessManager = artifacts.require('$AccessManager');
const AccessManagedTarget = artifacts.require('$AccessManagedTarget');
const Ownable = artifacts.require('$Ownable');

const BASE_ROLES = buildBaseRoles();

contract('AccessManager', function (accounts) {
  const [admin, manager, guardian, member, user, other] = accounts;

  // Add members
  BASE_ROLES.ADMIN.members = [admin];
  BASE_ROLES.SOME_ADMIN.members = [manager];
  BASE_ROLES.SOME_GUARDIAN.members = [guardian];
  BASE_ROLES.SOME.members = [member];
  BASE_ROLES.PUBLIC.members = [admin, manager, guardian, member, user, other];

  beforeEach(async function () {
    this.roles = BASE_ROLES;
    this.manager = await AccessManager.new(admin);
    this.target = await AccessManagedTarget.new(this.manager.address);

    for (const { id: roleId, admin, guardian, members } of Object.values(BASE_ROLES)) {
      if (roleId === this.roles.PUBLIC.id) continue; // Every address belong to public and is locked
      if (roleId === this.roles.ADMIN.id) continue; // Admin set during construction and is locked

      // Set admin role avoiding default
      if (admin.id !== this.roles.ADMIN.id) {
        await this.manager.$_setRoleAdmin(roleId, admin.id);
      }

      // Set guardian role avoiding default
      if (guardian.id !== this.roles.ADMIN.id) {
        await this.manager.$_setRoleGuardian(roleId, guardian.id);
      }

      // Grant role to members
      for (const member of members) {
        await this.manager.$_grantRole(roleId, member, 0, 0);
      }
    }
  });

  describe('during construction', async function () {
    it('grants admin role to initialAdmin', async function () {
      const manager = await AccessManager.new(other);
      expect(await manager.hasRole(this.roles.ADMIN.id, other).then(formatAccess)).to.be.deep.equal([true, '0']);
    });

    it('rejects zero address for initialAdmin', async function () {
      await expectRevertCustomError(AccessManager.new(constants.ZERO_ADDRESS), 'AccessManagerInvalidInitialAdmin', [
        constants.ZERO_ADDRESS,
      ]);
    });

    it('initializes setup roles correctly', async function () {
      for (const { id: roleId, admin, guardian, members } of Object.values(BASE_ROLES)) {
        expect(await this.manager.getRoleAdmin(roleId)).to.be.bignumber.equal(admin.id);
        expect(await this.manager.getRoleGuardian(roleId)).to.be.bignumber.equal(guardian.id);

        const isMember = Object.fromEntries(members.map(member => [member, true]));

        for (const user of this.roles.PUBLIC.members) {
          expect(await this.manager.hasRole(roleId, user).then(formatAccess)).to.be.deep.equal([!!isMember[user], '0']);
        }
      }
    });
  });

  describe('getters', async function () {
    describe('#expiration', function () {
      it('has a 7 days default expiration', async function () {
        expect(await this.manager.expiration()).to.be.bignumber.equal(EXPIRATION);
      });
    });

    describe('#minSetback', function () {
      it('has a 5 days default minimum setback', async function () {
        expect(await this.manager.minSetback()).to.be.bignumber.equal(MINSETBACK);
      });
    });

    describe('#isTargetClosed', function () {
      shouldBehaveLikeClosable({
        closed: function () {
          it('returns true', async function () {
            expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(true);
          });
        },
        open: function () {
          it('returns false', async function () {
            expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(false);
          });
        },
      });
    });

    describe('#getTargetFunctionRole', function () {
      const methodSelector = selector('something(address,bytes)');

      it('returns the target function role', async function () {
        const roleId = web3.utils.toBN(21498);
        await this.manager.$_setTargetFunctionRole(this.target.address, methodSelector, roleId);

        expect(await this.manager.getTargetFunctionRole(this.target.address, methodSelector)).to.be.bignumber.equal(
          roleId,
        );
      });

      it('returns the ADMIN role if not set', async function () {
        expect(await this.manager.getTargetFunctionRole(this.target.address, methodSelector)).to.be.bignumber.equal(
          this.roles.ADMIN.id,
        );
      });
    });

    describe('#getTargetAdminDelay', function () {
      describe('when the target admin delay is setup', function () {
        beforeEach('set target admin delay', async function () {
          this.oldDelay = await this.manager.getTargetAdminDelay(this.target.address);
          this.newDelay = time.duration.days(10);

          await this.manager.$_setTargetAdminDelay(this.target.address, this.newDelay);
          this.delay = MINSETBACK; // For shouldBehaveLikeDelay
        });

        shouldBehaveLikeDelay('effect', {
          before: function () {
            beforeEach('consume previously set grant delay', async function () {
              // Consume previously set delay
              await mine();
            });

            it('returns the old target admin delay', async function () {
              expect(await this.manager.getTargetAdminDelay(this.target.address)).to.be.bignumber.equal(this.oldDelay);
            });
          },
          after: function () {
            beforeEach('consume previously set grant delay', async function () {
              // Consume previously set delay
              await mine();
            });

            it('returns the new target admin delay', async function () {
              expect(await this.manager.getTargetAdminDelay(this.target.address)).to.be.bignumber.equal(this.newDelay);
            });
          },
        });
      });

      it('returns the 0 if not set', async function () {
        expect(await this.manager.getTargetAdminDelay(this.target.address)).to.be.bignumber.equal('0');
      });
    });

    describe('#getRoleAdmin', function () {
      const roleId = web3.utils.toBN(5234907);

      it('returns the role admin', async function () {
        const adminId = web3.utils.toBN(789433);

        await this.manager.$_setRoleAdmin(roleId, adminId);

        expect(await this.manager.getRoleAdmin(roleId)).to.be.bignumber.equal(adminId);
      });

      it('returns the ADMIN role if not set', async function () {
        expect(await this.manager.getRoleAdmin(roleId)).to.be.bignumber.equal(this.roles.ADMIN.id);
      });
    });

    describe('#getRoleGuardian', function () {
      const roleId = web3.utils.toBN(5234907);

      it('returns the role guardian', async function () {
        const guardianId = web3.utils.toBN(789433);

        await this.manager.$_setRoleGuardian(roleId, guardianId);

        expect(await this.manager.getRoleGuardian(roleId)).to.be.bignumber.equal(guardianId);
      });

      it('returns the ADMIN role if not set', async function () {
        expect(await this.manager.getRoleGuardian(roleId)).to.be.bignumber.equal(this.roles.ADMIN.id);
      });
    });

    describe('#getRoleGrantDelay', function () {
      const roleId = web3.utils.toBN(9248439);

      describe('when the grant admin delay is setup', function () {
        beforeEach('set grant admin delay', async function () {
          this.oldDelay = await this.manager.getRoleGrantDelay(roleId);
          this.newDelay = time.duration.days(11);

          await this.manager.$_setGrantDelay(roleId, this.newDelay);
          this.delay = MINSETBACK; // For shouldBehaveLikeDelay
        });

        shouldBehaveLikeDelay('grant', {
          before: function () {
            beforeEach('consume previously set grant delay', async function () {
              // Consume previously set delay
              await mine();
            });

            it('returns the old role grant delay', async function () {
              expect(await this.manager.getRoleGrantDelay(roleId)).to.be.bignumber.equal(this.oldDelay);
            });
          },
          after: function () {
            beforeEach('consume previously set grant delay', async function () {
              // Consume previously set delay
              await mine();
            });

            it('returns the new role grant delay', async function () {
              expect(await this.manager.getRoleGrantDelay(roleId)).to.be.bignumber.equal(this.newDelay);
            });
          },
        });
      });

      it('returns the 0 if not set', async function () {
        expect(await this.manager.getTargetAdminDelay(this.target.address)).to.be.bignumber.equal('0');
      });
    });

    describe('#getAccess', function () {
      beforeEach('set role', function () {
        this.role = { id: web3.utils.toBN(9452) };
        this.caller = user;
      });

      shouldBehaveLikeGetAccess({
        roleGranted: {
          roleWithGrantDelay: {
            callerWithExecutionDelay: {
              before: async function () {
                beforeEach('consume previously set grant delay', async function () {
                  // Consume previously set delay
                  await mine();
                });

                it('role is not in effect and execution delay is set', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);
                  expect(access[0]).to.be.bignumber.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.be.bignumber.equal(this.executionDelay); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                  // Not in effect yet
                  expect(await time.latest()).to.be.bignumber.lt(access[0]);
                });
              },
              after: async function () {
                beforeEach('consume previously set grant delay', async function () {
                  // Consume previously set delay
                  await mine();
                });

                it('access has role in effect and execution delay is set', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);

                  expect(access[0]).to.be.bignumber.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.be.bignumber.equal(this.executionDelay); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                  // Already in effect
                  expect(await time.latest()).to.be.bignumber.equal(access[0]);
                });
              },
            },
            callerWithoutExecutionDelay: {
              before: function () {
                beforeEach('consume previously set grant delay', async function () {
                  // Consume previously set delay
                  await mine();
                });

                it('access has role not in effect without execution delay', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);
                  expect(access[0]).to.be.bignumber.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                  // Not in effect yet
                  expect(await time.latest()).to.be.bignumber.lt(access[0]);
                });
              },
              after: function () {
                beforeEach('consume previously set grant delay', async function () {
                  // Consume previously set delay
                  await mine();
                });

                it('role is in effect without execution delay', async function () {
                  const access = await this.manager.getAccess(this.role.id, this.caller);
                  expect(access[0]).to.be.bignumber.equal(this.delayEffect); // inEffectSince
                  expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                  // Already in effect
                  expect(await time.latest()).to.be.bignumber.equal(access[0]);
                });
              },
            },
          },
          roleWithoutGrantDelay: {
            callerWithExecutionDelay: function () {
              it('access has role in effect and execution delay is set', async function () {
                const access = await this.manager.getAccess(this.role.id, this.caller);
                expect(access[0]).to.be.bignumber.equal(await time.latest()); // inEffectSince
                expect(access[1]).to.be.bignumber.equal(this.executionDelay); // currentDelay
                expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                // Already in effect
                expect(await time.latest()).to.be.bignumber.equal(access[0]);
              });
            },
            callerWithoutExecutionDelay: function () {
              it('access has role in effect without execution delay', async function () {
                const access = await this.manager.getAccess(this.role.id, this.caller);
                expect(access[0]).to.be.bignumber.equal(await time.latest()); // inEffectSince
                expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                // Already in effect
                expect(await time.latest()).to.be.bignumber.equal(access[0]);
              });
            },
          },
        },
        roleNotGranted: function () {
          it('has empty access', async function () {
            const access = await this.manager.getAccess(this.role.id, this.caller);
            expect(access[0]).to.be.bignumber.equal('0'); // inEffectSince
            expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
            expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
            expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect
          });
        },
      });
    });

    describe('#hasRole', function () {
      beforeEach('', function () {
        this.role = { id: web3.utils.toBN(49832) };
        this.calldata = '0x1234';
        this.caller = user;
      });

      shouldBehaveLikeHasRole({
        requiredPublicRole: async function () {
          it('has PUBLIC role', async function () {
            const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
            expect(isMember).to.be.true;
            expect(executionDelay).to.be.bignumber.eq('0');
          });
        },
        notRequiredPublicRole: {
          roleGranted: {
            roleWithGrantDelay: {
              callerWithExecutionDelay: {
                before: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  it('does not have role but execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.false;
                    expect(executionDelay).to.be.bignumber.eq(this.executionDelay);
                  });
                },
                after: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  it('has role and execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.true;
                    expect(executionDelay).to.be.bignumber.eq(this.executionDelay);
                  });
                },
              },
              callerWithoutExecutionDelay: {
                before: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  it('does not have role nor execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.false;
                    expect(executionDelay).to.be.bignumber.eq('0');
                  });
                },
                after: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  it('has role and no execution delay', async function () {
                    const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                    expect(isMember).to.be.true;
                    expect(executionDelay).to.be.bignumber.eq('0');
                  });
                },
              },
            },
            roleWithoutGrantDelay: {
              callerWithExecutionDelay: function () {
                it('has role and execution delay', async function () {
                  const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                  expect(isMember).to.be.true;
                  expect(executionDelay).to.be.bignumber.eq(this.executionDelay);
                });
              },
              callerWithoutExecutionDelay: function () {
                it('has role and no execution delay', async function () {
                  const { isMember, executionDelay } = await this.manager.hasRole(this.role.id, this.caller);
                  expect(isMember).to.be.true;
                  expect(executionDelay).to.be.bignumber.eq('0');
                });
              },
            },
          },
          roleNotGranted: function () {},
        },
      });
    });
  });

  describe('admin operations', function () {
    beforeEach('set required role', async function () {
      this.role = this.roles.ADMIN;
    });

    describe('subject to a delay', function () {
      describe('#labelRole', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'labelRole(uint64,string)';
            const args = [123443, 'TEST'];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it('emits an event with the label', async function () {
          expectEvent(await this.manager.labelRole(this.roles.SOME.id, 'Some label', { from: admin }), 'RoleLabel', {
            roleId: this.roles.SOME.id,
            label: 'Some label',
          });
        });

        it('updates label on a second call', async function () {
          await this.manager.labelRole(this.roles.SOME.id, 'Some label', { from: admin });

          expectEvent(await this.manager.labelRole(this.roles.SOME.id, 'Updated label', { from: admin }), 'RoleLabel', {
            roleId: this.roles.SOME.id,
            label: 'Updated label',
          });
        });

        it('reverts labeling PUBLIC_ROLE', async function () {
          await expectRevertCustomError(
            this.manager.labelRole(this.roles.PUBLIC.id, 'Some label', { from: admin }),
            'AccessManagerLockedRole',
            [this.roles.PUBLIC.id],
          );
        });

        it('reverts labeling ADMIN_ROLE', async function () {
          await expectRevertCustomError(
            this.manager.labelRole(this.roles.ADMIN.id, 'Some label', { from: admin }),
            'AccessManagerLockedRole',
            [this.roles.ADMIN.id],
          );
        });
      });

      describe('#setRoleAdmin', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'setRoleAdmin(uint64,uint64)';
            const args = [93445, 84532];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it("sets any role's admin if called by an admin", async function () {
          expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.SOME_ADMIN.id);

          const { receipt } = await this.manager.setRoleAdmin(this.roles.SOME.id, this.roles.ADMIN.id, { from: admin });
          expectEvent(receipt, 'RoleAdminChanged', { roleId: this.roles.SOME.id, admin: this.roles.ADMIN.id });

          expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
        });

        it('reverts setting PUBLIC_ROLE admin', async function () {
          await expectRevertCustomError(
            this.manager.setRoleAdmin(this.roles.PUBLIC.id, this.roles.ADMIN.id, { from: admin }),
            'AccessManagerLockedRole',
            [this.roles.PUBLIC.id],
          );
        });

        it('reverts setting ADMIN_ROLE admin', async function () {
          await expectRevertCustomError(
            this.manager.setRoleAdmin(this.roles.ADMIN.id, this.roles.ADMIN.id, { from: admin }),
            'AccessManagerLockedRole',
            [this.roles.ADMIN.id],
          );
        });
      });

      describe('#setRoleGuardian', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'setRoleGuardian(uint64,uint64)';
            const args = [93445, 84532];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        it("sets any role's guardian if called by an admin", async function () {
          expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(
            this.roles.SOME_GUARDIAN.id,
          );

          const { receipt } = await this.manager.setRoleGuardian(this.roles.SOME.id, this.roles.ADMIN.id, {
            from: admin,
          });
          expectEvent(receipt, 'RoleGuardianChanged', { roleId: this.roles.SOME.id, guardian: this.roles.ADMIN.id });

          expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
        });

        it('reverts setting PUBLIC_ROLE admin', async function () {
          await expectRevertCustomError(
            this.manager.setRoleGuardian(this.roles.PUBLIC.id, this.roles.ADMIN.id, { from: admin }),
            'AccessManagerLockedRole',
            [this.roles.PUBLIC.id],
          );
        });

        it('reverts setting ADMIN_ROLE admin', async function () {
          await expectRevertCustomError(
            this.manager.setRoleGuardian(this.roles.ADMIN.id, this.roles.ADMIN.id, { from: admin }),
            'AccessManagerLockedRole',
            [this.roles.ADMIN.id],
          );
        });
      });

      describe('#setGrantDelay', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'setGrantDelay(uint64,uint32)';
            const args = [984910, time.duration.days(2)];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        describe('when increasing the delay', function () {
          const oldDelay = web3.utils.toBN(10);
          const newDelay = web3.utils.toBN(100);

          beforeEach('sets old delay', async function () {
            this.role = this.roles.SOME;
            await this.manager.$_setGrantDelay(this.role.id, oldDelay);
            await time.increase(MINSETBACK);
            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(oldDelay);
          });

          it('increases the delay after minsetback', async function () {
            const { receipt } = await this.manager.setGrantDelay(this.role.id, newDelay, { from: admin });
            const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
            expectEvent(receipt, 'RoleGrantDelayChanged', {
              roleId: this.role.id,
              delay: newDelay,
              since: timestamp.add(MINSETBACK),
            });

            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(oldDelay);
            await time.increase(MINSETBACK);
            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(newDelay);
          });
        });

        describe('when reducing the delay', function () {
          const oldDelay = time.duration.days(10);

          beforeEach('sets old delay', async function () {
            this.role = this.roles.SOME;
            await this.manager.$_setGrantDelay(this.role.id, oldDelay);
            await time.increase(MINSETBACK);
            expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(oldDelay);
          });

          describe('when the delay difference is shorter than minimum setback', function () {
            const newDelay = oldDelay.subn(1);

            it('increases the delay after minsetback', async function () {
              const { receipt } = await this.manager.setGrantDelay(this.role.id, newDelay, { from: admin });
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
              expectEvent(receipt, 'RoleGrantDelayChanged', {
                roleId: this.role.id,
                delay: newDelay,
                since: timestamp.add(MINSETBACK),
              });

              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(oldDelay);
              await time.increase(MINSETBACK);
              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(newDelay);
            });
          });

          describe('when the delay difference is longer than minimum setback', function () {
            const newDelay = web3.utils.toBN(1);

            beforeEach('assert delay difference is higher than minsetback', function () {
              expect(oldDelay.sub(newDelay)).to.be.bignumber.gt(MINSETBACK);
            });

            it('increases the delay after delay difference', async function () {
              const setback = oldDelay.sub(newDelay);
              const { receipt } = await this.manager.setGrantDelay(this.role.id, newDelay, { from: admin });
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
              expectEvent(receipt, 'RoleGrantDelayChanged', {
                roleId: this.role.id,
                delay: newDelay,
                since: timestamp.add(setback),
              });

              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(oldDelay);
              await time.increase(setback);
              expect(await this.manager.getRoleGrantDelay(this.role.id)).to.be.bignumber.equal(newDelay);
            });
          });
        });
      });

      describe('#setTargetAdminDelay', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'setTargetAdminDelay(address,uint32)';
            const args = [Wallet.generate().getChecksumAddressString(), time.duration.days(3)];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeDelayedAdminOperation();
        });

        describe('when increasing the delay', function () {
          const oldDelay = time.duration.days(10);
          const newDelay = time.duration.days(11);
          const target = Wallet.generate().getChecksumAddressString();

          beforeEach('sets old delay', async function () {
            await this.manager.$_setTargetAdminDelay(target, oldDelay);
            await time.increase(MINSETBACK);
            expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(oldDelay);
          });

          it('increases the delay after minsetback', async function () {
            const { receipt } = await this.manager.setTargetAdminDelay(target, newDelay, { from: admin });
            const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
            expectEvent(receipt, 'TargetAdminDelayUpdated', {
              target,
              delay: newDelay,
              since: timestamp.add(MINSETBACK),
            });

            expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(oldDelay);
            await time.increase(MINSETBACK);
            expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(newDelay);
          });
        });

        describe('when reducing the delay', function () {
          const oldDelay = time.duration.days(10);
          const target = Wallet.generate().getChecksumAddressString();

          beforeEach('sets old delay', async function () {
            await this.manager.$_setTargetAdminDelay(target, oldDelay);
            await time.increase(MINSETBACK);
            expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(oldDelay);
          });

          describe('when the delay difference is shorter than minimum setback', function () {
            const newDelay = oldDelay.subn(1);

            it('increases the delay after minsetback', async function () {
              const { receipt } = await this.manager.setTargetAdminDelay(target, newDelay, { from: admin });
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
              expectEvent(receipt, 'TargetAdminDelayUpdated', {
                target,
                delay: newDelay,
                since: timestamp.add(MINSETBACK),
              });

              expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(oldDelay);
              await time.increase(MINSETBACK);
              expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(newDelay);
            });
          });

          describe('when the delay difference is longer than minimum setback', function () {
            const newDelay = web3.utils.toBN(1);

            beforeEach('assert delay difference is higher than minsetback', function () {
              expect(oldDelay.sub(newDelay)).to.be.bignumber.gt(MINSETBACK);
            });

            it('increases the delay after delay difference', async function () {
              const setback = oldDelay.sub(newDelay);
              const { receipt } = await this.manager.setTargetAdminDelay(target, newDelay, { from: admin });
              const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
              expectEvent(receipt, 'TargetAdminDelayUpdated', {
                target,
                delay: newDelay,
                since: timestamp.add(setback),
              });

              expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(oldDelay);
              await time.increase(setback);
              expect(await this.manager.getTargetAdminDelay(target)).to.be.bignumber.equal(newDelay);
            });
          });
        });
      });
    });

    describe('not subject to a delay', function () {
      describe('#updateAuthority', function () {
        beforeEach('create a target and a new authority', async function () {
          this.newAuthority = await AccessManager.new(admin);
          this.newManagedTarget = await AccessManagedTarget.new(this.manager.address);
        });

        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'updateAuthority(address,address)';
            const args = [this.newManagedTarget.address, this.newAuthority.address];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeNotDelayedAdminOperation({
            externalCaller: {
              requiredPublicRole: function () {
                it('reverts as AccessManagerUnauthorizedAccount', async function () {
                  await expectRevertCustomError(
                    web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
                    'AccessManagerUnauthorizedAccount',
                    [this.caller, this.roles.ADMIN.id], // Although PUBLIC_ROLE is required, admin ops are not subject to target function roles
                  );
                });
              },
            },
          });
        });

        it('changes the authority', async function () {
          expect(await this.newManagedTarget.authority()).to.be.equal(this.manager.address);

          const { tx } = await this.manager.updateAuthority(this.newManagedTarget.address, this.newAuthority.address, {
            from: admin,
          });

          // Managed contract is responsible of notifying the change through an event
          await expectEvent.inTransaction(tx, this.newManagedTarget, 'AuthorityUpdated', {
            authority: this.newAuthority.address,
          });

          expect(await this.newManagedTarget.authority()).to.be.equal(this.newAuthority.address);
        });
      });

      describe('#setTargetClosed', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'setTargetClosed(address,bool)';
            const args = [Wallet.generate().getChecksumAddressString(), true];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeNotDelayedAdminOperation({
            externalCaller: {
              requiredPublicRole: function () {
                it('reverts as AccessManagerUnauthorizedAccount', async function () {
                  await expectRevertCustomError(
                    web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
                    'AccessManagerUnauthorizedAccount',
                    [this.caller, this.roles.ADMIN.id], // Although PUBLIC_ROLE is required, admin ops are not subject to target function roles
                  );
                });
              },
            },
          });
        });

        it('closes and opens a target', async function () {
          const close = await this.manager.setTargetClosed(this.target.address, true, { from: admin });
          expectEvent(close.receipt, 'TargetClosed', { target: this.target.address, closed: true });

          expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(true);

          const open = await this.manager.setTargetClosed(this.target.address, false, { from: admin });
          expectEvent(open.receipt, 'TargetClosed', { target: this.target.address, closed: false });
          expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(false);
        });

        it('reverts if closing the manager', async function () {
          await expectRevertCustomError(
            this.manager.setTargetClosed(this.manager.address, true, { from: admin }),
            'AccessManagerLockedAccount',
            [this.manager.address],
          );
        });
      });

      describe('#setTargetFunctionRole', function () {
        describe('restrictions', function () {
          beforeEach('set method and args', async function () {
            const method = 'setTargetFunctionRole(address,bytes4[],uint64)';
            const args = [Wallet.generate().getChecksumAddressString(), ['0x12345678'], 443342];
            this.calldata = this.manager.contract.methods[method](...args).encodeABI();
          });

          shouldBehaveLikeNotDelayedAdminOperation({
            externalCaller: {
              requiredPublicRole: function () {
                it('reverts as AccessManagerUnauthorizedAccount', async function () {
                  await expectRevertCustomError(
                    web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
                    'AccessManagerUnauthorizedAccount',
                    [this.caller, this.roles.ADMIN.id], // Although PUBLIC_ROLE is required, admin ops are not subject to target function roles
                  );
                });
              },
            },
          });
        });

        const sigs = ['someFunction()', 'someOtherFunction(uint256)', 'oneMoreFunction(address,uint8)'].map(selector);

        it('sets function roles', async function () {
          for (const sig of sigs) {
            expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
              this.roles.ADMIN.id,
            );
          }

          const { receipt: receipt1 } = await this.manager.setTargetFunctionRole(
            this.target.address,
            sigs,
            this.roles.SOME.id,
            {
              from: admin,
            },
          );

          for (const sig of sigs) {
            expectEvent(receipt1, 'TargetFunctionRoleUpdated', {
              target: this.target.address,
              selector: sig,
              roleId: this.roles.SOME.id,
            });
            expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
              this.roles.SOME.id,
            );
          }

          const { receipt: receipt2 } = await this.manager.setTargetFunctionRole(
            this.target.address,
            [sigs[1]],
            this.roles.SOME_ADMIN.id,
            {
              from: admin,
            },
          );
          expectEvent(receipt2, 'TargetFunctionRoleUpdated', {
            target: this.target.address,
            selector: sigs[1],
            roleId: this.roles.SOME_ADMIN.id,
          });

          for (const sig of sigs) {
            expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
              sig == sigs[1] ? this.roles.SOME_ADMIN.id : this.roles.SOME.id,
            );
          }
        });
      });

      describe('role admin operations', function () {
        const ANOTHER_ADMIN = web3.utils.toBN(0xdeadc0de1);
        const ANOTHER_ROLE = web3.utils.toBN(0xdeadc0de2);

        beforeEach('set required role', async function () {
          // Make admin a member of ANOTHER_ADMIN
          await this.manager.$_grantRole(ANOTHER_ADMIN, admin, 0, 0);
          await this.manager.$_setRoleAdmin(ANOTHER_ROLE, ANOTHER_ADMIN);

          this.role = { id: ANOTHER_ADMIN };
          this.user = user;
          await this.manager.$_grantRole(this.role.id, this.user, 0, 0);
        });

        describe('#grantRole', function () {
          describe('restrictions', function () {
            beforeEach('set method and args', async function () {
              const method = 'grantRole(uint64,address,uint32)';
              const args = [ANOTHER_ROLE, Wallet.generate().getChecksumAddressString(), 0];
              this.calldata = this.manager.contract.methods[method](...args).encodeABI();
            });

            shouldBehaveLikeNotDelayedAdminOperation({
              externalCaller: {
                requiredPublicRole: function () {
                  it('reverts as AccessManagerUnauthorizedAccount', async function () {
                    await expectRevertCustomError(
                      web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
                      'AccessManagerUnauthorizedAccount',
                      [this.caller, ANOTHER_ADMIN], // Role admin ops require the role's admin
                    );
                  });
                },
              },
            });
          });

          describe('when the user is not a role member', function () {
            describe('with grant delay', function () {
              beforeEach('set grant delay and grant role', async function () {
                // Delay granting
                this.grantDelay = time.duration.weeks(2);
                await this.manager.$_setGrantDelay(ANOTHER_ROLE, this.grantDelay);
                await time.increase(MINSETBACK);

                // Grant role
                this.executionDelay = time.duration.days(3);
                expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                  false,
                  '0',
                ]);
                const { receipt } = await this.manager.grantRole(ANOTHER_ROLE, this.user, this.executionDelay, {
                  from: admin,
                });

                this.receipt = receipt;
                this.delay = this.grantDelay; // For shouldBehaveLikeDelay
              });

              shouldBehaveLikeDelay('grant', {
                before: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  it('does not grant role to the user yet', async function () {
                    const timestamp = await clockFromReceipt.timestamp(this.receipt).then(web3.utils.toBN);
                    expectEvent(this.receipt, 'RoleGranted', {
                      roleId: ANOTHER_ROLE,
                      account: this.user,
                      since: timestamp.add(this.grantDelay),
                      delay: this.executionDelay,
                      newMember: true,
                    });

                    // Access is correctly stored
                    const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                    expect(access[0]).to.be.bignumber.equal(timestamp.add(this.grantDelay)); // inEffectSince
                    expect(access[1]).to.be.bignumber.equal(this.executionDelay); // currentDelay
                    expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                    expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                    // Not in effect yet
                    const currentTimestamp = await time.latest();
                    expect(currentTimestamp).to.be.a.bignumber.lt(access[0]);
                    expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                      false,
                      this.executionDelay.toString(),
                    ]);
                  });
                },
                after: function () {
                  beforeEach('consume previously set grant delay', async function () {
                    // Consume previously set delay
                    await mine();
                  });

                  it('grants role to the user', async function () {
                    const timestamp = await clockFromReceipt.timestamp(this.receipt).then(web3.utils.toBN);
                    expectEvent(this.receipt, 'RoleGranted', {
                      roleId: ANOTHER_ROLE,
                      account: this.user,
                      since: timestamp.add(this.grantDelay),
                      delay: this.executionDelay,
                      newMember: true,
                    });

                    // Access is correctly stored
                    const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                    expect(access[0]).to.be.bignumber.equal(timestamp.add(this.grantDelay)); // inEffectSince
                    expect(access[1]).to.be.bignumber.equal(this.executionDelay); // currentDelay
                    expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                    expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                    // Already in effect
                    const currentTimestamp = await time.latest();
                    expect(currentTimestamp).to.be.a.bignumber.equal(access[0]);
                    expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
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
                await time.increase(MINSETBACK);
              });

              it('immediately grants the role to the user', async function () {
                this.executionDelay = time.duration.days(6);
                expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                  false,
                  '0',
                ]);
                const { receipt } = await this.manager.grantRole(ANOTHER_ROLE, this.user, this.executionDelay, {
                  from: admin,
                });

                const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
                expectEvent(receipt, 'RoleGranted', {
                  roleId: ANOTHER_ROLE,
                  account: this.user,
                  since: timestamp,
                  delay: this.executionDelay,
                  newMember: true,
                });

                // Access is correctly stored
                const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                expect(access[0]).to.be.bignumber.equal(timestamp); // inEffectSince
                expect(access[1]).to.be.bignumber.equal(this.executionDelay); // currentDelay
                expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                // Already in effect
                const currentTimestamp = await time.latest();
                expect(currentTimestamp).to.be.a.bignumber.equal(access[0]);
                expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                  true,
                  this.executionDelay.toString(),
                ]);
              });
            });
          });

          describe('when the user is already a role member', function () {
            beforeEach('make user role member', async function () {
              this.previousExecutionDelay = time.duration.days(6);
              await this.manager.$_grantRole(ANOTHER_ROLE, this.user, 0, this.previousExecutionDelay);
              this.oldAccess = await this.manager.getAccess(ANOTHER_ROLE, user);
            });

            describe('with grant delay', function () {
              beforeEach('set granting delay', async function () {
                // Delay granting
                const grantDelay = time.duration.weeks(2);
                await this.manager.$_setGrantDelay(ANOTHER_ROLE, grantDelay);
                await time.increase(MINSETBACK);
              });

              describe('when increasing the execution delay', function () {
                beforeEach('set increased new execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);

                  this.newExecutionDelay = this.previousExecutionDelay.add(time.duration.days(4));
                });

                it('emits event and immediately changes the execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);
                  const { receipt } = await this.manager.grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay, {
                    from: admin,
                  });
                  const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

                  expectEvent(receipt, 'RoleGranted', {
                    roleId: ANOTHER_ROLE,
                    account: this.user,
                    since: timestamp,
                    delay: this.newExecutionDelay,
                    newMember: false,
                  });

                  // Access is correctly stored
                  const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                  expect(access[0]).to.be.bignumber.equal(this.oldAccess[0]); // inEffectSince
                  expect(access[1]).to.be.bignumber.equal(this.newExecutionDelay); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                  // Already in effect
                  expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
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

                  this.newExecutionDelay = this.previousExecutionDelay.sub(time.duration.days(4));
                  const { receipt } = await this.manager.grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay, {
                    from: admin,
                  });
                  this.grantTimestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

                  this.receipt = receipt;
                  this.delay = this.previousExecutionDelay.sub(this.newExecutionDelay); // For shouldBehaveLikeDelay
                });

                it('emits event', function () {
                  expectEvent(this.receipt, 'RoleGranted', {
                    roleId: ANOTHER_ROLE,
                    account: this.user,
                    since: this.grantTimestamp.add(this.delay),
                    delay: this.newExecutionDelay,
                    newMember: false,
                  });
                });

                shouldBehaveLikeDelay('execution delay effect', {
                  before: function () {
                    beforeEach('consume effect delay', async function () {
                      // Consume previously set delay
                      await mine();
                    });

                    it('does not change the execution delay yet', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                      expect(access[0]).to.be.bignumber.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.be.bignumber.equal(this.previousExecutionDelay); // currentDelay
                      expect(access[2]).to.be.bignumber.equal(this.newExecutionDelay); // pendingDelay
                      expect(access[3]).to.be.bignumber.equal(this.grantTimestamp.add(this.delay)); // pendingDelayEffect

                      // Not in effect yet
                      expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                        true,
                        this.previousExecutionDelay.toString(),
                      ]);
                    });
                  },
                  after: function () {
                    beforeEach('consume effect delay', async function () {
                      // Consume previously set delay
                      await mine();
                    });

                    it('changes the execution delay', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, user);

                      expect(access[0]).to.be.bignumber.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.be.bignumber.equal(this.newExecutionDelay); // currentDelay
                      expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                      expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                      // Already in effect
                      expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
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
                await time.increase(MINSETBACK);
              });

              describe('when increasing the execution delay', function () {
                beforeEach('set increased new execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);

                  this.newExecutionDelay = this.previousExecutionDelay.add(time.duration.days(4));
                });

                it('emits event and immediately changes the execution delay', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, this.user).then(formatAccess)).to.be.deep.equal([
                    true,
                    this.previousExecutionDelay.toString(),
                  ]);
                  const { receipt } = await this.manager.grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay, {
                    from: admin,
                  });
                  const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

                  expectEvent(receipt, 'RoleGranted', {
                    roleId: ANOTHER_ROLE,
                    account: this.user,
                    since: timestamp,
                    delay: this.newExecutionDelay,
                    newMember: false,
                  });

                  // Access is correctly stored
                  const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                  expect(access[0]).to.be.bignumber.equal(this.oldAccess[0]); // inEffectSince
                  expect(access[1]).to.be.bignumber.equal(this.newExecutionDelay); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                  // Already in effect
                  expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
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

                  this.newExecutionDelay = this.previousExecutionDelay.sub(time.duration.days(4));
                  const { receipt } = await this.manager.grantRole(ANOTHER_ROLE, this.user, this.newExecutionDelay, {
                    from: admin,
                  });
                  this.grantTimestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

                  this.receipt = receipt;
                  this.delay = this.previousExecutionDelay.sub(this.newExecutionDelay); // For shouldBehaveLikeDelay
                });

                it('emits event', function () {
                  expectEvent(this.receipt, 'RoleGranted', {
                    roleId: ANOTHER_ROLE,
                    account: this.user,
                    since: this.grantTimestamp.add(this.delay),
                    delay: this.newExecutionDelay,
                    newMember: false,
                  });
                });

                shouldBehaveLikeDelay('execution delay effect', {
                  before: function () {
                    beforeEach('consume effect delay', async function () {
                      // Consume previously set delay
                      await mine();
                    });

                    it('does not change the execution delay yet', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                      expect(access[0]).to.be.bignumber.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.be.bignumber.equal(this.previousExecutionDelay); // currentDelay
                      expect(access[2]).to.be.bignumber.equal(this.newExecutionDelay); // pendingDelay
                      expect(access[3]).to.be.bignumber.equal(this.grantTimestamp.add(this.delay)); // pendingDelayEffect

                      // Not in effect yet
                      expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                        true,
                        this.previousExecutionDelay.toString(),
                      ]);
                    });
                  },
                  after: function () {
                    beforeEach('consume effect delay', async function () {
                      // Consume previously set delay
                      await mine();
                    });

                    it('changes the execution delay', async function () {
                      // Access is correctly stored
                      const access = await this.manager.getAccess(ANOTHER_ROLE, user);

                      expect(access[0]).to.be.bignumber.equal(this.oldAccess[0]); // inEffectSince
                      expect(access[1]).to.be.bignumber.equal(this.newExecutionDelay); // currentDelay
                      expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                      expect(access[3]).to.be.bignumber.equal('0'); // pendingDelayEffect

                      // Already in effect
                      expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
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
              const method = 'revokeRole(uint64,address)';
              const args = [ANOTHER_ROLE, Wallet.generate().getChecksumAddressString()];
              this.calldata = this.manager.contract.methods[method](...args).encodeABI();

              // Need to be set before revoking
              await this.manager.$_grantRole(...args, 0, 0);
            });

            shouldBehaveLikeNotDelayedAdminOperation({
              externalCaller: {
                requiredPublicRole: function () {
                  it('reverts as AccessManagerUnauthorizedAccount', async function () {
                    await expectRevertCustomError(
                      web3.eth.sendTransaction({ to: this.target.address, data: this.calldata, from: this.caller }),
                      'AccessManagerUnauthorizedAccount',
                      [this.caller, ANOTHER_ADMIN], // Role admin ops require the role's admin
                    );
                  });
                },
              },
            });
          });

          describe('when role has been granted', function () {
            beforeEach('grant role with grant delay', async function () {
              this.grantDelay = time.duration.weeks(1);
              await this.manager.$_grantRole(ANOTHER_ROLE, user, this.grantDelay, 0);

              this.delay = this.grantDelay; // For shouldBehaveLikeDelay
            });

            shouldBehaveLikeDelay('grant', {
              before: function () {
                beforeEach('consume previously set grant delay', async function () {
                  // Consume previously set delay
                  await mine();
                });

                it('revokes a granted role that will take effect in the future', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                    false,
                    '0',
                  ]);

                  const { receipt } = await this.manager.revokeRole(ANOTHER_ROLE, user, { from: admin });
                  expectEvent(receipt, 'RoleRevoked', { roleId: ANOTHER_ROLE, account: user });

                  expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                    false,
                    '0',
                  ]);

                  const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                  expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
                  expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // effect
                });
              },
              after: function () {
                beforeEach('consume previously set grant delay', async function () {
                  // Consume previously set delay
                  await mine();
                });

                it('revokes a granted role that already took effect', async function () {
                  expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                    true,
                    '0',
                  ]);

                  const { receipt } = await this.manager.revokeRole(ANOTHER_ROLE, user, { from: admin });
                  expectEvent(receipt, 'RoleRevoked', { roleId: ANOTHER_ROLE, account: user });

                  expect(await this.manager.hasRole(ANOTHER_ROLE, user).then(formatAccess)).to.be.deep.equal([
                    false,
                    '0',
                  ]);

                  const access = await this.manager.getAccess(ANOTHER_ROLE, user);
                  expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
                  expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
                  expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
                  expect(access[3]).to.be.bignumber.equal('0'); // effect
                });
              },
            });
          });

          describe('when role has not been granted', function () {
            it('has no effect', async function () {
              expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
                false,
                '0',
              ]);
              await this.manager.revokeRole(this.roles.SOME.id, user, { from: manager });
              expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
                false,
                '0',
              ]);
            });
          });

          it('reverts revoking PUBLIC_ROLE', async function () {
            await expectRevertCustomError(
              this.manager.revokeRole(this.roles.PUBLIC.id, user, { from: admin }),
              'AccessManagerLockedRole',
              [this.roles.PUBLIC.id],
            );
          });
        });
      });
    });
  });

  // describe('Roles management', function () {
  //   describe('grant role', function () {
  //     describe('without a grant delay', function () {
  //       it('without an execute delay', async function () {
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);

  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp,
  //           delay: '0',
  //           newMember: true,
  //         });

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([true, '0']);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });

  //       it('with an execute delay', async function () {
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);

  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, executeDelay, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp,
  //           delay: executeDelay,
  //           newMember: true,
  //         });

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           true,
  //           executeDelay.toString(),
  //         ]);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal(executeDelay); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });

  //       it('to a user that is already in the role', async function () {
  //         expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //           true,
  //           '0',
  //         ]);
  //         await this.manager.grantRole(this.roles.SOME.id, member, 0, { from: manager });
  //         expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //           true,
  //           '0',
  //         ]);
  //       });

  //       it('to a user that is scheduled for joining the role', async function () {
  //         await this.manager.$_grantRole(this.roles.SOME.id, user, 10, 0); // grant delay 10
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);
  //         await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);
  //       });

  //       it('grant role is restricted', async function () {
  //         await expectRevertCustomError(
  //           this.manager.grantRole(this.roles.SOME.id, user, 0, { from: other }),
  //           'AccessManagerUnauthorizedAccount',
  //           [other, this.roles.SOME_ADMIN.id],
  //         );
  //       });
  //     });

  //     describe('with a grant delay', function () {
  //       beforeEach(async function () {
  //         await this.manager.$_setGrantDelay(this.roles.SOME.id, grantDelay);
  //         await time.increase(MINSETBACK);
  //       });

  //       it('granted role is not active immediately', async function () {
  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp.add(grantDelay),
  //           delay: '0',
  //           newMember: true,
  //         });

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([
  //           false,
  //           '0',
  //         ]);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });

  //       it('granted role is active after the delay', async function () {
  //         const { receipt } = await this.manager.grantRole(this.roles.SOME.id, user, 0, { from: manager });
  //         const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //         expectEvent(receipt, 'RoleGranted', {
  //           roleId: this.roles.SOME.id,
  //           account: user,
  //           since: timestamp.add(grantDelay),
  //           delay: '0',
  //           newMember: true,
  //         });

  //         await time.increase(grantDelay);

  //         expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([true, '0']);

  //         const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //         expect(access[0]).to.be.bignumber.equal(timestamp.add(grantDelay)); // inRoleSince
  //         expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //         expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //         expect(access[3]).to.be.bignumber.equal('0'); // effect
  //       });
  //     });

  //     it('cannot grant public role', async function () {
  //       await expectRevertCustomError(
  //         this.manager.$_grantRole(this.roles.PUBLIC.id, other, 0, executeDelay, { from: manager }),
  //         'AccessManagerLockedRole',
  //         [this.roles.PUBLIC.id],
  //       );
  //     });
  //   });

  //   describe('revoke role', function () {
  //     it('from a user that is already in the role', async function () {
  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([true, '0']);

  //       const { receipt } = await this.manager.revokeRole(this.roles.SOME.id, member, { from: manager });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: member });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //         false,
  //         '0',
  //       ]);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('from a user that is scheduled for joining the role', async function () {
  //       await this.manager.$_grantRole(this.roles.SOME.id, user, 10, 0); // grant delay 10

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const { receipt } = await this.manager.revokeRole(this.roles.SOME.id, user, { from: manager });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: user });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('from a user that is not in the role', async function () {
  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);
  //       await this.manager.revokeRole(this.roles.SOME.id, user, { from: manager });
  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);
  //     });

  //     it('revoke role is restricted', async function () {
  //       await expectRevertCustomError(
  //         this.manager.revokeRole(this.roles.SOME.id, member, { from: other }),
  //         'AccessManagerUnauthorizedAccount',
  //         [other, this.roles.SOME_ADMIN.id],
  //       );
  //     });
  //   });

  //   describe('renounce role', function () {
  //     it('for a user that is already in the role', async function () {
  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([true, '0']);

  //       const { receipt } = await this.manager.renounceRole(this.roles.SOME.id, member, { from: member });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: member });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, member).then(formatAccess)).to.be.deep.equal([
  //         false,
  //         '0',
  //       ]);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('for a user that is schedule for joining the role', async function () {
  //       await this.manager.$_grantRole(this.roles.SOME.id, user, 10, 0); // grant delay 10

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const { receipt } = await this.manager.renounceRole(this.roles.SOME.id, user, { from: user });
  //       expectEvent(receipt, 'RoleRevoked', { roleId: this.roles.SOME.id, account: user });

  //       expect(await this.manager.hasRole(this.roles.SOME.id, user).then(formatAccess)).to.be.deep.equal([false, '0']);

  //       const access = await this.manager.getAccess(this.roles.SOME.id, user);
  //       expect(access[0]).to.be.bignumber.equal('0'); // inRoleSince
  //       expect(access[1]).to.be.bignumber.equal('0'); // currentDelay
  //       expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(access[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('for a user that is not in the role', async function () {
  //       await this.manager.renounceRole(this.roles.SOME.id, user, { from: user });
  //     });

  //     it('bad user confirmation', async function () {
  //       await expectRevertCustomError(
  //         this.manager.renounceRole(this.roles.SOME.id, member, { from: user }),
  //         'AccessManagerBadConfirmation',
  //         [],
  //       );
  //     });
  //   });

  //   describe('change role admin', function () {
  //     it("admin can set any role's admin", async function () {
  //       expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.SOME_ADMIN.id);

  //       const { receipt } = await this.manager.setRoleAdmin(this.roles.SOME.id, this.roles.ADMIN.id, { from: admin });
  //       expectEvent(receipt, 'RoleAdminChanged', { roleId: this.roles.SOME.id, admin: this.roles.ADMIN.id });

  //       expect(await this.manager.getRoleAdmin(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
  //     });

  //     it("setting a role's admin is restricted", async function () {
  //       await expectRevertCustomError(
  //         this.manager.setRoleAdmin(this.roles.SOME.id, this.roles.SOME.id, { from: manager }),
  //         'AccessManagerUnauthorizedAccount',
  //         [manager, this.roles.ADMIN.id],
  //       );
  //     });
  //   });

  //   describe('change role guardian', function () {
  //     it("admin can set any role's admin", async function () {
  //       expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(
  //         this.roles.SOME_GUARDIAN.id,
  //       );

  //       const { receipt } = await this.manager.setRoleGuardian(this.roles.SOME.id, this.roles.ADMIN.id, {
  //         from: admin,
  //       });
  //       expectEvent(receipt, 'RoleGuardianChanged', { roleId: this.roles.SOME.id, guardian: this.roles.ADMIN.id });

  //       expect(await this.manager.getRoleGuardian(this.roles.SOME.id)).to.be.bignumber.equal(this.roles.ADMIN.id);
  //     });

  //     it("setting a role's admin is restricted", async function () {
  //       await expectRevertCustomError(
  //         this.manager.setRoleGuardian(this.roles.SOME.id, this.roles.SOME.id, { from: other }),
  //         'AccessManagerUnauthorizedAccount',
  //         [other, this.roles.ADMIN.id],
  //       );
  //     });
  //   });

  //   describe('change execution delay', function () {
  //     it('increasing the delay has immediate effect', async function () {
  //       const oldDelay = web3.utils.toBN(10);
  //       const newDelay = web3.utils.toBN(100);

  //       // role is already granted (with no delay) in the initial setup. this update takes time.
  //       await this.manager.$_grantRole(this.roles.SOME.id, member, 0, oldDelay);

  //       const accessBefore = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
  //       expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

  //       const { receipt } = await this.manager.grantRole(this.roles.SOME.id, member, newDelay, {
  //         from: manager,
  //       });
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //       expectEvent(receipt, 'RoleGranted', {
  //         roleId: this.roles.SOME.id,
  //         account: member,
  //         since: timestamp,
  //         delay: newDelay,
  //         newMember: false,
  //       });

  //       // immediate effect
  //       const accessAfter = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessAfter[1]).to.be.bignumber.equal(newDelay); // currentDelay
  //       expect(accessAfter[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessAfter[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('decreasing the delay takes time', async function () {
  //       const oldDelay = web3.utils.toBN(100);
  //       const newDelay = web3.utils.toBN(10);

  //       // role is already granted (with no delay) in the initial setup. this update takes time.
  //       await this.manager.$_grantRole(this.roles.SOME.id, member, 0, oldDelay);

  //       const accessBefore = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessBefore[1]).to.be.bignumber.equal(oldDelay); // currentDelay
  //       expect(accessBefore[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessBefore[3]).to.be.bignumber.equal('0'); // effect

  //       const { receipt } = await this.manager.grantRole(this.roles.SOME.id, member, newDelay, {
  //         from: manager,
  //       });
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);
  //       const setback = oldDelay.sub(newDelay);

  //       expectEvent(receipt, 'RoleGranted', {
  //         roleId: this.roles.SOME.id,
  //         account: member,
  //         since: timestamp.add(setback),
  //         delay: newDelay,
  //         newMember: false,
  //       });

  //       // no immediate effect
  //       const accessAfter = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessAfter[1]).to.be.bignumber.equal(oldDelay); // currentDelay
  //       expect(accessAfter[2]).to.be.bignumber.equal(newDelay); // pendingDelay
  //       expect(accessAfter[3]).to.be.bignumber.equal(timestamp.add(setback)); // effect

  //       // delayed effect
  //       await time.increase(setback);
  //       const accessAfterSetback = await this.manager.getAccess(this.roles.SOME.id, member);
  //       expect(accessAfterSetback[1]).to.be.bignumber.equal(newDelay); // currentDelay
  //       expect(accessAfterSetback[2]).to.be.bignumber.equal('0'); // pendingDelay
  //       expect(accessAfterSetback[3]).to.be.bignumber.equal('0'); // effect
  //     });

  //     it('can set a user execution delay during the grant delay', async function () {
  //       await this.manager.$_grantRole(this.roles.SOME.id, other, 10, 0);
  //       // here: "other" is pending to get the role, but doesn't yet have it.

  //       const { receipt } = await this.manager.grantRole(this.roles.SOME.id, other, executeDelay, { from: manager });
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //       // increasing the execution delay from 0 to executeDelay is immediate
  //       expectEvent(receipt, 'RoleGranted', {
  //         roleId: this.roles.SOME.id,
  //         account: other,
  //         since: timestamp,
  //         delay: executeDelay,
  //         newMember: false,
  //       });
  //     });
  //   });

  // describe('with AccessManaged target contract', function () {
  //   beforeEach('deploy target contract', async function () {
  //     this.target = await AccessManagedTarget.new(this.manager.address);
  //     // helpers for indirect calls
  //     this.callData = selector('fnRestricted()');
  //     this.call = [this.target.address, this.callData];
  //     this.opId = web3.utils.keccak256(
  //       web3.eth.abi.encodeParameters(['address', 'address', 'bytes'], [user, ...this.call]),
  //     );
  //     this.direct = (opts = {}) => this.target.fnRestricted({ from: user, ...opts });
  //     this.schedule = (opts = {}) => this.manager.schedule(...this.call, 0, { from: user, ...opts });
  //     this.execute = (opts = {}) => this.manager.execute(...this.call, { from: user, ...opts });
  //     this.cancel = (opts = {}) => this.manager.cancel(user, ...this.call, { from: user, ...opts });
  //   });

  //   describe('Change function permissions', function () {
  //     const sigs = ['someFunction()', 'someOtherFunction(uint256)', 'oneMoreFunction(address,uint8)'].map(selector);

  //     it('admin can set function role', async function () {
  //       for (const sig of sigs) {
  //         expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
  //           this.roles.ADMIN.id,
  //         );
  //       }

  //       const { receipt: receipt1 } = await this.manager.setTargetFunctionRole(
  //         this.target.address,
  //         sigs,
  //         this.roles.SOME.id,
  //         {
  //           from: admin,
  //         },
  //       );

  //       for (const sig of sigs) {
  //         expectEvent(receipt1, 'TargetFunctionRoleUpdated', {
  //           target: this.target.address,
  //           selector: sig,
  //           roleId: this.roles.SOME.id,
  //         });
  //         expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
  //           this.roles.SOME.id,
  //         );
  //       }

  //       const { receipt: receipt2 } = await this.manager.setTargetFunctionRole(
  //         this.target.address,
  //         [sigs[1]],
  //         this.roles.SOME_ADMIN.id,
  //         {
  //           from: admin,
  //         },
  //       );
  //       expectEvent(receipt2, 'TargetFunctionRoleUpdated', {
  //         target: this.target.address,
  //         selector: sigs[1],
  //         roleId: this.roles.SOME_ADMIN.id,
  //       });

  //       for (const sig of sigs) {
  //         expect(await this.manager.getTargetFunctionRole(this.target.address, sig)).to.be.bignumber.equal(
  //           sig == sigs[1] ? this.roles.SOME_ADMIN.id : this.roles.SOME.id,
  //         );
  //       }
  //     });

  //     it('non-admin cannot set function role', async function () {
  //       await expectRevertCustomError(
  //         this.manager.setTargetFunctionRole(this.target.address, sigs, this.roles.SOME.id, { from: other }),
  //         'AccessManagerUnauthorizedAccount',
  //         [other, this.roles.ADMIN.id],
  //       );
  //     });
  //   });

  //   // WIP
  //   describe('Calling restricted & unrestricted functions', function () {
  //     for (const [callerRoles, currentRole, closed, delay] of product(
  //       [[], [BASE_ROLES.SOME]], // callerRoles
  //       [{}, BASE_ROLES.ADMIN, BASE_ROLES.SOME, BASE_ROLES.PUBLIC], // currentRoles
  //       [false, true], // closed
  //       [null, executeDelay], // delay,
  //     )) {
  //       const isCaller = callerRoles.some(({ id }) => id == currentRole.id);

  //       // can we call with a delay ?
  //       const indirectSuccess = (currentRole.id == BASE_ROLES.PUBLIC.id || isCaller) && !closed;

  //       // can we call without a delay ?
  //       const directSuccess = (currentRole.id == BASE_ROLES.PUBLIC.id || (isCaller && !delay)) && !closed;

  //       const description = [
  //         'Caller in roles',
  //         '[' + callerRoles.map(({ name }) => name).join(', ') + ']',
  //         delay ? 'with a delay' : 'without a delay',
  //         '+',
  //         'functions open to role',
  //         '[' + (currentRole.name ?? '') + ']',
  //         closed ? `(closed)` : '',
  //       ].join(' ');

  //       describe(description, function () {
  //         beforeEach(async function () {
  //           // setup
  //           await Promise.all([
  //             this.manager.$_setTargetClosed(this.target.address, closed),
  //             currentRole.id &&
  //               this.manager.$_setTargetFunctionRole(this.target.address, selector('fnRestricted()'), currentRole.id),
  //             currentRole.id &&
  //               this.manager.$_setTargetFunctionRole(this.target.address, selector('fnUnrestricted()'), currentRole.id),
  //             ...callerRoles
  //               .filter(({ id }) => id != this.roles.PUBLIC.id)
  //               .map(({ id }) => this.manager.$_grantRole(id, user, 0, delay ?? 0)),
  //           ]);

  //           // post setup checks
  //           expect(await this.manager.isTargetClosed(this.target.address)).to.be.equal(closed);

  //           if (currentRole.id) {
  //             expect(
  //               await this.manager.getTargetFunctionRole(this.target.address, selector('fnRestricted()')),
  //             ).to.be.bignumber.equal(currentRole.id);
  //             expect(
  //               await this.manager.getTargetFunctionRole(this.target.address, selector('fnUnrestricted()')),
  //             ).to.be.bignumber.equal(currentRole.id);
  //           }

  //           for (const role of callerRoles) {
  //             const roleId = role.id;
  //             const access = await this.manager.getAccess(roleId, user);
  //             expect(access[0]).to.be.bignumber.gt('0'); // inRoleSince
  //             expect(access[1]).to.be.bignumber.eq(roleId == this.roles.PUBLIC.id ? '0' : String(delay ?? 0)); // currentDelay
  //             expect(access[2]).to.be.bignumber.equal('0'); // pendingDelay
  //             expect(access[3]).to.be.bignumber.equal('0'); // effect
  //           }
  //         });

  //         it('canCall', async function () {
  //           const result = await this.manager.canCall(user, this.target.address, selector('fnRestricted()'));
  //           expect(result[0]).to.be.equal(directSuccess);
  //           expect(result[1]).to.be.bignumber.equal(!directSuccess && indirectSuccess ? delay ?? '0' : '0');
  //         });

  //         it('Calling a non restricted function never revert', async function () {
  //           expectEvent(await this.target.fnUnrestricted({ from: user }), 'CalledUnrestricted', {
  //             caller: user,
  //           });
  //         });

  //         it(`Calling a restricted function directly should ${
  //           directSuccess ? 'succeed' : 'revert'
  //         }`, async function () {
  //           const promise = this.direct();

  //           if (directSuccess) {
  //             expectEvent(await promise, 'CalledRestricted', { caller: user });
  //           } else if (indirectSuccess) {
  //             await expectRevertCustomError(promise, 'AccessManagerNotScheduled', [this.opId]);
  //           } else {
  //             await expectRevertCustomError(promise, 'AccessManagedUnauthorized', [user]);
  //           }
  //         });

  //         it('Calling indirectly: only execute', async function () {
  //           // execute without schedule
  //           if (directSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt, tx } = await this.execute();

  //             expectEvent.notEmitted(receipt, 'OperationExecuted', { operationId: this.opId });
  //             await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });

  //             // nonce is not modified
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore);
  //           } else if (indirectSuccess) {
  //             await expectRevertCustomError(this.execute(), 'AccessManagerNotScheduled', [this.opId]);
  //           } else {
  //             await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling indirectly: schedule and execute', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(
  //               timestamp.add(directSuccess ? web3.utils.toBN(0) : delay),
  //             );

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // execute without wait
  //             if (directSuccess) {
  //               const { receipt, tx } = await this.execute();

  //               await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
  //               if (delay && currentRole.id !== this.roles.PUBLIC.id) {
  //                 expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
  //                 expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //               }

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else if (indirectSuccess) {
  //               await expectRevertCustomError(this.execute(), 'AccessManagerNotReady', [this.opId]);
  //             } else {
  //               await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling indirectly: schedule wait and execute', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(
  //               timestamp.add(directSuccess ? web3.utils.toBN(0) : delay),
  //             );

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // wait
  //             await time.increase(delay ?? 0);

  //             // execute without wait
  //             if (directSuccess || indirectSuccess) {
  //               const { receipt, tx } = await this.execute();

  //               await expectEvent.inTransaction(tx, this.target, 'CalledRestricted', { caller: this.manager.address });
  //               if (delay && currentRole.id !== this.roles.PUBLIC.id) {
  //                 expectEvent(receipt, 'OperationExecuted', { operationId: this.opId });
  //                 expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //               }

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else {
  //               await expectRevertCustomError(this.execute(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling directly: schedule and call', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             const schedule = timestamp.add(directSuccess ? web3.utils.toBN(0) : delay);
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // execute without wait
  //             const promise = this.direct();
  //             if (directSuccess) {
  //               expectEvent(await promise, 'CalledRestricted', { caller: user });

  //               // schedule is not reset
  //               expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else if (indirectSuccess) {
  //               await expectRevertCustomError(promise, 'AccessManagerNotReady', [this.opId]);
  //             } else {
  //               await expectRevertCustomError(promise, 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Calling directly: schedule wait and call', async function () {
  //           if (directSuccess || indirectSuccess) {
  //             const nonceBefore = await this.manager.getNonce(this.opId);
  //             const { receipt } = await this.schedule();
  //             const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //             expectEvent(receipt, 'OperationScheduled', {
  //               operationId: this.opId,
  //               caller: user,
  //               target: this.call[0],
  //               data: this.call[1],
  //             });

  //             // if can call directly, delay should be 0. Otherwise, the delay should be applied
  //             const schedule = timestamp.add(directSuccess ? web3.utils.toBN(0) : delay);
  //             expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //             // nonce is incremented
  //             expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));

  //             // wait
  //             await time.increase(delay ?? 0);

  //             // execute without wait
  //             const promise = await this.direct();
  //             if (directSuccess) {
  //               expectEvent(await promise, 'CalledRestricted', { caller: user });

  //               // schedule is not reset
  //               expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(schedule);

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else if (indirectSuccess) {
  //               const receipt = await promise;

  //               expectEvent(receipt, 'CalledRestricted', { caller: user });
  //               await expectEvent.inTransaction(receipt.tx, this.manager, 'OperationExecuted', {
  //                 operationId: this.opId,
  //               });

  //               // schedule is reset
  //               expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');

  //               // nonce is not modified by execute
  //               expect(await this.manager.getNonce(this.opId)).to.be.bignumber.equal(nonceBefore.addn(1));
  //             } else {
  //               await expectRevertCustomError(this.direct(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //             }
  //           } else {
  //             await expectRevertCustomError(this.schedule(), 'AccessManagerUnauthorizedCall', [user, ...this.call]);
  //           }
  //         });

  //         it('Scheduling for later than needed'); // TODO
  //       });
  //     }
  //   });

  //   describe('Indirect execution corner-cases', async function () {
  //     beforeEach(async function () {
  //       await this.manager.$_setTargetFunctionRole(this.target.address, this.callData, this.roles.SOME.id);
  //       await this.manager.$_grantRole(this.roles.SOME.id, user, 0, executeDelay);
  //     });

  //     it('Checking canCall when caller is the manager depend on the _executionId', async function () {
  //       const result = await this.manager.canCall(this.manager.address, this.target.address, '0x00000000');
  //       expect(result[0]).to.be.false;
  //       expect(result[1]).to.be.bignumber.equal('0');
  //     });

  //     it('Cannot execute earlier', async function () {
  //       const { receipt } = await this.schedule();
  //       const timestamp = await clockFromReceipt.timestamp(receipt).then(web3.utils.toBN);

  //       expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal(timestamp.add(executeDelay));

  //       // too early
  //       await helpers.time.setNextBlockTimestamp(timestamp.add(executeDelay).subn(1));
  //       await expectRevertCustomError(this.execute(), 'AccessManagerNotReady', [this.opId]);

  //       // the revert happened one second before the execution delay expired
  //       expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay).subn(1));

  //       // ok
  //       await helpers.time.setNextBlockTimestamp(timestamp.add(executeDelay));
  //       await this.execute();

  //       // the success happened when the delay was reached (earliest possible)
  //       expect(await time.latest()).to.be.bignumber.equal(timestamp.add(executeDelay));
  //     });

  //     it('Cannot schedule an already scheduled operation', async function () {
  //       const { receipt } = await this.schedule();
  //       expectEvent(receipt, 'OperationScheduled', {
  //         operationId: this.opId,
  //         caller: user,
  //         target: this.call[0],
  //         data: this.call[1],
  //       });

  //       await expectRevertCustomError(this.schedule(), 'AccessManagerAlreadyScheduled', [this.opId]);
  //     });

  //     it('Cannot cancel an operation that is not scheduled', async function () {
  //       await expectRevertCustomError(this.cancel(), 'AccessManagerNotScheduled', [this.opId]);
  //     });

  //     it('Cannot cancel an operation that is already executed', async function () {
  //       await this.schedule();
  //       await time.increase(executeDelay);
  //       await this.execute();

  //       await expectRevertCustomError(this.cancel(), 'AccessManagerNotScheduled', [this.opId]);
  //     });

  //     it('Scheduler can cancel', async function () {
  //       const scheduler = user;
  //       await this.schedule({ from: scheduler });

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

  //       expectEvent(await this.cancel({ from: scheduler }), 'OperationCanceled', { operationId: this.opId });

  //       expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //     });

  //     it('Guardian can cancel', async function () {
  //       await this.schedule();

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

  //       expectEvent(await this.cancel({ from: guardian }), 'OperationCanceled', { operationId: this.opId });

  //       expect(await this.manager.getSchedule(this.opId)).to.be.bignumber.equal('0');
  //     });

  //     it('Cancel is restricted', async function () {
  //       await this.schedule();

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');

  //       await expectRevertCustomError(this.cancel({ from: other }), 'AccessManagerUnauthorizedCancel', [
  //         other,
  //         user,
  //         ...this.call,
  //       ]);

  //       expect(await this.manager.getSchedule(this.opId)).to.not.be.bignumber.equal('0');
  //     });

  //     it('Can re-schedule after execution', async function () {
  //       await this.schedule();
  //       await time.increase(executeDelay);
  //       await this.execute();

  //       // reschedule
  //       const { receipt } = await this.schedule();
  //       expectEvent(receipt, 'OperationScheduled', {
  //         operationId: this.opId,
  //         caller: user,
  //         target: this.call[0],
  //         data: this.call[1],
  //       });
  //     });

  //     it('Can re-schedule after cancel', async function () {
  //       await this.schedule();
  //       await this.cancel();

  //       // reschedule
  //       const { receipt } = await this.schedule();
  //       expectEvent(receipt, 'OperationScheduled', {
  //         operationId: this.opId,
  //         caller: user,
  //         target: this.call[0],
  //         data: this.call[1],
  //       });
  //     });
  //   });
  // });

  // describe('with Ownable target contract', function () {
  //   const roleId = web3.utils.toBN(1);

  //   beforeEach(async function () {
  //     this.ownable = await Ownable.new(this.manager.address);

  //     // add user to role
  //     await this.manager.$_grantRole(roleId, user, 0, 0);
  //   });

  //   it('initial state', async function () {
  //     expect(await this.ownable.owner()).to.be.equal(this.manager.address);
  //   });

  //   describe('Contract is closed', function () {
  //     beforeEach(async function () {
  //       await this.manager.$_setTargetClosed(this.ownable.address, true);
  //     });

  //     it('directly call: reverts', async function () {
  //       await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [user]);
  //     });

  //     it('relayed call (with role): reverts', async function () {
  //       await expectRevertCustomError(
  //         this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user }),
  //         'AccessManagerUnauthorizedCall',
  //         [user, this.ownable.address, selector('$_checkOwner()')],
  //       );
  //     });

  //     it('relayed call (without role): reverts', async function () {
  //       await expectRevertCustomError(
  //         this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other }),
  //         'AccessManagerUnauthorizedCall',
  //         [other, this.ownable.address, selector('$_checkOwner()')],
  //       );
  //     });
  //   });

  //   describe('Contract is managed', function () {
  //     describe('function is open to specific role', function () {
  //       beforeEach(async function () {
  //         await this.manager.$_setTargetFunctionRole(this.ownable.address, selector('$_checkOwner()'), roleId);
  //       });

  //       it('directly call: reverts', async function () {
  //         await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
  //           user,
  //         ]);
  //       });

  //       it('relayed call (with role): success', async function () {
  //         await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user });
  //       });

  //       it('relayed call (without role): reverts', async function () {
  //         await expectRevertCustomError(
  //           this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other }),
  //           'AccessManagerUnauthorizedCall',
  //           [other, this.ownable.address, selector('$_checkOwner()')],
  //         );
  //       });
  //     });

  //     describe('function is open to public role', function () {
  //       beforeEach(async function () {
  //         await this.manager.$_setTargetFunctionRole(
  //           this.ownable.address,
  //           selector('$_checkOwner()'),
  //           this.roles.PUBLIC.id,
  //         );
  //       });

  //       it('directly call: reverts', async function () {
  //         await expectRevertCustomError(this.ownable.$_checkOwner({ from: user }), 'OwnableUnauthorizedAccount', [
  //           user,
  //         ]);
  //       });

  //       it('relayed call (with role): success', async function () {
  //         await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: user });
  //       });

  //       it('relayed call (without role): success', async function () {
  //         await this.manager.execute(this.ownable.address, selector('$_checkOwner()'), { from: other });
  //       });
  //     });
  //   });
  // });

  // describe('authority update', function () {
  //   beforeEach(async function () {
  //     this.newManager = await AccessManager.new(admin);
  //     this.target = await AccessManagedTarget.new(this.manager.address);
  //   });

  //   it('admin can change authority', async function () {
  //     expect(await this.target.authority()).to.be.equal(this.manager.address);

  //     const { tx } = await this.manager.updateAuthority(this.target.address, this.newManager.address, { from: admin });
  //     await expectEvent.inTransaction(tx, this.target, 'AuthorityUpdated', { authority: this.newManager.address });

  //     expect(await this.target.authority()).to.be.equal(this.newManager.address);
  //   });

  //   it('cannot set an address without code as the authority', async function () {
  //     await expectRevertCustomError(
  //       this.manager.updateAuthority(this.target.address, user, { from: admin }),
  //       'AccessManagedInvalidAuthority',
  //       [user],
  //     );
  //   });

  //   it('updateAuthority is restricted on manager', async function () {
  //     await expectRevertCustomError(
  //       this.manager.updateAuthority(this.target.address, this.newManager.address, { from: other }),
  //       'AccessManagerUnauthorizedAccount',
  //       [other, this.roles.ADMIN.id],
  //     );
  //   });

  //   it('setAuthority is restricted on AccessManaged', async function () {
  //     await expectRevertCustomError(
  //       this.target.setAuthority(this.newManager.address, { from: admin }),
  //       'AccessManagedUnauthorized',
  //       [admin],
  //     );
  //   });
  // });

  // TODO:
  // - check opening/closing a contract
  // - check updating the contract delay
  // - check the delay applies to admin function
  // describe.skip('contract modes', function () {});
});
