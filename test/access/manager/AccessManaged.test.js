const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const time = require('../../helpers/time');

async function fixture() {
  const [admin, roleMember, other] = await ethers.getSigners();

  const authority = await ethers.deployContract('$AccessManager', [admin]);
  const managed = await ethers.deployContract('$AccessManagedTarget', [authority]);

  const anotherAuthority = await ethers.deployContract('$AccessManager', [admin]);
  const authorityObserveIsConsuming = await ethers.deployContract('$AuthorityObserveIsConsuming');

  await impersonate(authority.target);
  const authorityAsSigner = await ethers.getSigner(authority.target);

  return {
    roleMember,
    other,
    authorityAsSigner,
    authority,
    managed,
    authorityObserveIsConsuming,
    anotherAuthority,
  };
}

describe('AccessManaged', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('sets authority and emits AuthorityUpdated event during construction', async function () {
    await expect(this.managed.deploymentTransaction())
      .to.emit(this.managed, 'AuthorityUpdated')
      .withArgs(this.authority);
  });

  describe('restricted modifier', function () {
    beforeEach(async function () {
      this.selector = this.managed.fnRestricted.getFragment().selector;
      this.role = 42n;
      await this.authority.$_setTargetFunctionRole(this.managed, this.selector, this.role);
      await this.authority.$_grantRole(this.role, this.roleMember, 0, 0);
    });

    it('succeeds when role is granted without execution delay', async function () {
      await this.managed.connect(this.roleMember)[this.selector]();
    });

    it('reverts when role is not granted', async function () {
      await expect(this.managed.connect(this.other)[this.selector]())
        .to.be.revertedWithCustomError(this.managed, 'AccessManagedUnauthorized')
        .withArgs(this.other);
    });

    it('panics in short calldata', async function () {
      // We avoid adding the `restricted` modifier to the fallback function because other tests may depend on it
      // being accessible without restrictions. We check for the internal `_checkCanCall` instead.
      await expect(this.managed.$_checkCanCall(this.roleMember, '0x1234')).to.be.reverted;
    });

    describe('when role is granted with execution delay', function () {
      beforeEach(async function () {
        const executionDelay = 911n;
        await this.authority.$_grantRole(this.role, this.roleMember, 0, executionDelay);
      });

      it('reverts if the operation is not scheduled', async function () {
        const fn = this.managed.interface.getFunction(this.selector);
        const calldata = this.managed.interface.encodeFunctionData(fn, []);
        const opId = await this.authority.hashOperation(this.roleMember, this.managed, calldata);

        await expect(this.managed.connect(this.roleMember)[this.selector]())
          .to.be.revertedWithCustomError(this.authority, 'AccessManagerNotScheduled')
          .withArgs(opId);
      });

      it('succeeds if the operation is scheduled', async function () {
        // Arguments
        const delay = time.duration.hours(12);
        const fn = this.managed.interface.getFunction(this.selector);
        const calldata = this.managed.interface.encodeFunctionData(fn, []);

        // Schedule
        const scheduledAt = (await time.clock.timestamp()) + 1n;
        const when = scheduledAt + delay;
        await time.increaseTo.timestamp(scheduledAt, false);
        await this.authority.connect(this.roleMember).schedule(this.managed, calldata, when);

        // Set execution date
        await time.increaseTo.timestamp(when, false);

        // Shouldn't revert
        await this.managed.connect(this.roleMember)[this.selector]();
      });
    });
  });

  describe('setAuthority', function () {
    it('reverts if the caller is not the authority', async function () {
      await expect(this.managed.connect(this.other).setAuthority(this.other))
        .to.be.revertedWithCustomError(this.managed, 'AccessManagedUnauthorized')
        .withArgs(this.other);
    });

    it('reverts if the new authority is not a valid authority', async function () {
      await expect(this.managed.connect(this.authorityAsSigner).setAuthority(this.other))
        .to.be.revertedWithCustomError(this.managed, 'AccessManagedInvalidAuthority')
        .withArgs(this.other);
    });

    it('sets authority and emits AuthorityUpdated event', async function () {
      await expect(this.managed.connect(this.authorityAsSigner).setAuthority(this.anotherAuthority))
        .to.emit(this.managed, 'AuthorityUpdated')
        .withArgs(this.anotherAuthority);

      expect(await this.managed.authority()).to.equal(this.anotherAuthority);
    });
  });

  describe('isConsumingScheduledOp', function () {
    beforeEach(async function () {
      await this.managed.connect(this.authorityAsSigner).setAuthority(this.authorityObserveIsConsuming);
    });

    it('returns bytes4(0) when not consuming operation', async function () {
      expect(await this.managed.isConsumingScheduledOp()).to.equal('0x00000000');
    });

    it('returns isConsumingScheduledOp selector when consuming operation', async function () {
      const isConsumingScheduledOp = this.managed.interface.getFunction('isConsumingScheduledOp()');
      const fnRestricted = this.managed.fnRestricted.getFragment();
      await expect(this.managed.connect(this.other).fnRestricted())
        .to.emit(this.authorityObserveIsConsuming, 'ConsumeScheduledOpCalled')
        .withArgs(
          this.other,
          this.managed.interface.encodeFunctionData(fnRestricted, []),
          isConsumingScheduledOp.selector,
        );
    });
  });
});
