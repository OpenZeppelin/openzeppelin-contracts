const { expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const { Enum } = require('../../helpers/enums');
const { selector } = require('../../helpers/methods');

const AccessManager = artifacts.require('$AccessManager');
const DelayCondition = artifacts.require('DelayCondition');

const mask = (...groups) =>
  '0x' +
  groups
    .map(g => 1n << BigInt(g))
    .reduce((acc, mask) => acc | mask, 0n)
    .toString(16)
    .padStart(64, 0);

const AccessMode = Enum('Custom', 'Closed', 'Open');
const ADMIN_GROUP = 0;
const SOME_GROUP = 1;
const PUBLIC_GROUP = 255;

const initialGroups = {
  'grantGroup(uint8,address,address[])': mask(ADMIN_GROUP),
  'revokeGroup(uint8,address,address[])': mask(ADMIN_GROUP),
  'renounceGroup(uint8,address[])': mask(PUBLIC_GROUP),
  'setContractModeClosed(address)': mask(ADMIN_GROUP),
  'setContractModeCustom(address)': mask(ADMIN_GROUP),
  'setContractModeOpen(address)': mask(ADMIN_GROUP),
  'setFunctionAllowedGroup(address,bytes4[],uint8,bool)': mask(ADMIN_GROUP),
};

contract('AccessManager', function (accounts) {
  const [admin, other, condition] = accounts;

  beforeEach(async function () {
    this.manager = await AccessManager.new(admin);
  });

  it('correctly initialized', async function () {
    expect(await this.manager.getContractMode(this.manager.address)).to.be.bignumber.equal(AccessMode.Custom);

    for (const signature of Object.keys(this.manager.methods)) {
      expect(await this.manager.getFunctionAllowedGroups(this.manager.address, selector(signature))).to.be.equal(
        initialGroups[signature] || constants.ZERO_BYTES32,
      );
    }
    expect(await this.manager.methods['getUserGroups(address)'](admin)).to.be.equal(mask(ADMIN_GROUP, PUBLIC_GROUP));
    expect(await this.manager.methods['getUserGroups(address)'](other)).to.be.equal(mask(PUBLIC_GROUP));
    expect(await this.manager.methods['getUserGroups(address)'](condition)).to.be.equal(mask(PUBLIC_GROUP));
    expect(await this.manager.methods['getUserGroups(address,address[])'](admin, [ condition ])).to.be.equal(mask(PUBLIC_GROUP));
    expect(await this.manager.methods['getUserGroups(address,address[])'](other, [ condition ])).to.be.equal(mask(PUBLIC_GROUP));
  });

  describe('restricted functions', function () {
    describe('grantGroup', function () {
      it('authorized', async function () {
        expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));

        const receipt = await this.manager.grantGroup(SOME_GROUP, other, [], { from: admin });
        // expectEvent(receipt, 'RoleGranted', { account: other, role: mask(SOME_GROUP), sender: admin });

        expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));
      });

      it('unauthorized', async function () {
        await expectRevert(
          this.manager.grantGroup(SOME_GROUP, other, [], { from: other }),
          'AccessManaged: authority rejected',
        );
      });

      it('revert if user already has the role', async function () {
        await expectRevert(
          this.manager.grantGroup(ADMIN_GROUP, admin, [], { from: admin }),
          'Grant error: user already in group',
        );
      });
    });

    describe('revokeGroup', function () {
      beforeEach(async function () {
        await this.manager.$_grantGroup(SOME_GROUP, other, []);
      });

      it('authorized', async function () {
        expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));

        const receipt = await this.manager.revokeGroup(SOME_GROUP, other, [], { from: admin });
        // expectEvent(receipt, 'RoleRevoked', { account: other, role: mask(SOME_GROUP), sender: admin });

        expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
      });

      it('unauthorized', async function () {
        await expectRevert(
          this.manager.revokeGroup(SOME_GROUP, other, [], { from: other }),
          'AccessManaged: authority rejected',
        );
      });

      it('revert if user does not have the role', async function () {
        await expectRevert(
          this.manager.revokeGroup(SOME_GROUP, admin, [], { from: admin }),
          'Revoke error: user not in group',
        );
      });
    });

    describe('renounceGroup', function () {
      beforeEach(async function () {
        await this.manager.$_grantGroup(SOME_GROUP, other, []);
      });

      it('authorized', async function () {
        expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));

        const receipt = await this.manager.renounceGroup(SOME_GROUP, [], { from: other });
        // expectEvent(receipt, 'RoleRevoked', { account: other, role: mask(SOME_GROUP), sender: other });

        expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
      });

      it('revert if user already has the role', async function () {
        await expectRevert(this.manager.renounceGroup(SOME_GROUP, [], { from: admin }), 'Revoke error: user not in group');
      });
    });
  });

  describe('conditions', function () {
    describe('delay', function () {
      beforeEach(async function () {
        this.condition = await DelayCondition.new();

        // set authorisation
        await this.manager.setFunctionAllowedGroup(
          this.condition.address,
          [
            'setDelayTarget(address,uint48)',
            'setDelayCaller(address,address,uint48)',
            'setDelaySelector(address,address,bytes4,uint48)',
          ].map(selector),
          ADMIN_GROUP,
          true,
          { from: admin },
        );

        // Grant admin power through the condition and revoke "normal" admin power
        await this.manager.grantGroup(ADMIN_GROUP, admin, [ this.condition.address ], { from: admin });
        await this.manager.renounceGroup(ADMIN_GROUP, [], { from: admin });

        // data of the restricted call
        this.data = this.manager.contract.methods.grantGroup(SOME_GROUP, other, []).encodeABI();
      });

      describe('without delay', function () {
        it('authorized', async function () {
          expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));

          const receipt = await this.condition.execute(this.manager.address, this.data, { from: admin });
          // expectEvent(receipt, 'RoleGranted', { account: other, role: mask(SOME_GROUP), sender: admin });

          expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));
        });

        it('unauthorized', async function () {
          await expectRevert(
            this.condition.execute(this.manager.address, this.data, { from: other }),
            'AccessManaged: authority rejected',
          );
        });
      });

      describe('with delay', function () {
        beforeEach(async function () {
          this.duration = web3.utils.toBN(10);
          // execute it through the condition itself
          await this.condition.execute(this.condition.address, this.condition.contract.methods.setDelayTarget(this.manager.address, this.duration).encodeABI(), { from: admin });
          // check delay is set
          expect(await this.condition.getDelay(this.manager.address, admin, '0x00000000')).to.be.bignumber.equal(this.duration);
        });

        describe('operate on manager', function () {
          it('directly', async function () {
            await expectRevert(
              this.condition.execute(this.manager.address, this.data, { from: admin }),
              'Execute: not ready',
            );
          });

          it('unauthorized schedule', async function () {
            await expectRevert(
              this.condition.schedule(this.manager.address, this.data, { from: other }),
              'Schedule: unauthorized call',
            );
          });

          it('schedule and execute', async function () {
            await this.condition.schedule(this.manager.address, this.data, { from: admin });
            await expectRevert(
              this.condition.execute(this.manager.address, this.data, { from: admin }),
              'Execute: not ready',
            );
          });

          it('schedule, wait and execute', async function () {
            await this.condition.schedule(this.manager.address, this.data, { from: admin });
            await time.increase(this.duration);

            expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP));
            await this.condition.execute(this.manager.address, this.data, { from: admin });
            expect(await this.manager.getUserGroups(other)).to.be.equal(mask(PUBLIC_GROUP, SOME_GROUP));
          });
        });

        describe('operate on condition', function () {
          beforeEach(async function () {
            // lets try to remove the delay
            this.newDuration = web3.utils.toBN(0);
            this.data = this.condition.contract.methods.setDelayTarget(this.manager.address, this.newDuration).encodeABI();
          });

          it('directly', async function () {
            await expectRevert(
              this.condition.execute(this.condition.address, this.data, { from: admin }),
              'Execute: not ready',
            );
          });

          it('unauthorized schedule (skipped: auth not prechecked if target is condition)', async function () {
            await expectRevert(
              this.condition.schedule(this.condition.address, this.data, { from: other }),
              'Schedule: unauthorized call',
            );
          });

          it('schedule and execute', async function () {
            await this.condition.schedule(this.condition.address, this.data, { from: admin });
            await expectRevert(
              this.condition.execute(this.condition.address, this.data, { from: admin }),
              'Execute: not ready',
            );
          });

          it('schedule, wait and execute', async function () {
            await this.condition.schedule(this.condition.address, this.data, { from: admin });
            await time.increase(this.duration);

            expect(await this.condition.getDelay(this.manager.address, admin, '0x00000000')).to.be.bignumber.equal(this.duration);
            await this.condition.execute(this.condition.address, this.data, { from: admin });
            expect(await this.condition.getDelay(this.manager.address, admin, '0x00000000')).to.be.bignumber.equal(this.newDuration);
          });
        });
      });
    });
  });
});
