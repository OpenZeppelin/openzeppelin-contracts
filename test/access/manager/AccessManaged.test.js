const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { impersonate } = require('../../helpers/account');
const time = require('../../helpers/time');
const { EXPIRATION } = require('../../helpers/access-manager');

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

      it('reverts if the operation has expired', async function () {
        const fn = this.managed.interface.getFunction(this.selector);
        const calldata = this.managed.interface.encodeFunctionData(fn, []);
        const opId = await this.authority.hashOperation(this.roleMember, this.managed, calldata);

        // Schedule operation
        const scheduledAt = (await time.clock.timestamp()) + 1n;
        const delay = time.duration.hours(12);
        const when = scheduledAt + delay;
        await time.increaseTo.timestamp(scheduledAt, false);
        await this.authority.connect(this.roleMember).schedule(this.managed, calldata, when);

        // Wait until operation expires (expiration is 1 week)
        const expiredAt = when + EXPIRATION;
        await time.increaseTo.timestamp(expiredAt, false);

        // Should revert with AccessManagerExpired
        await expect(this.managed.connect(this.roleMember)[this.selector]())
          .to.be.revertedWithCustomError(this.authority, 'AccessManagerExpired')
          .withArgs(opId);
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

    it('reverts if the new authority is address(0)', async function () {
      await expect(this.managed.connect(this.authorityAsSigner).setAuthority(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(this.managed, 'AccessManagedInvalidAuthority')
        .withArgs(ethers.ZeroAddress);
    });

    it('sets authority and emits AuthorityUpdated event', async function () {
      await expect(this.managed.connect(this.authorityAsSigner).setAuthority(this.anotherAuthority))
        .to.emit(this.managed, 'AuthorityUpdated')
        .withArgs(this.anotherAuthority);

      expect(await this.managed.authority()).to.equal(this.anotherAuthority);
    });

    it('allows multiple authority changes and restricted modifier works after each change', async function () {
      // Setup role in original authority (needed for final verification)
      const selector = this.managed.fnRestricted.getFragment().selector;
      const role = 42n;
      await this.authority.$_setTargetFunctionRole(this.managed, selector, role);
      await this.authority.$_grantRole(role, this.roleMember, 0, 0);

      // First change: authority -> anotherAuthority
      await expect(this.managed.connect(this.authorityAsSigner).setAuthority(this.anotherAuthority))
        .to.emit(this.managed, 'AuthorityUpdated')
        .withArgs(this.anotherAuthority);
      expect(await this.managed.authority()).to.equal(this.anotherAuthority);

      // Setup role in new authority
      await this.anotherAuthority.$_setTargetFunctionRole(this.managed, selector, role);
      await this.anotherAuthority.$_grantRole(role, this.roleMember, 0, 0);

      // Verify restricted modifier works with new authority
      await this.managed.connect(this.roleMember)[selector]();

      // Second change: anotherAuthority -> authority (back to original)
      await impersonate(this.anotherAuthority.target);
      const anotherAuthorityAsSigner = await ethers.getSigner(this.anotherAuthority.target);
      await expect(this.managed.connect(anotherAuthorityAsSigner).setAuthority(this.authority))
        .to.emit(this.managed, 'AuthorityUpdated')
        .withArgs(this.authority);
      expect(await this.managed.authority()).to.equal(this.authority);

      // Verify restricted modifier still works with original authority
      await this.managed.connect(this.roleMember)[selector]();
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
