const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');

const cap = 500n;

async function fixture() {
  const [holder, spender, other] = await ethers.getSigners();
  const token = await ethers.deployContract('ERC20SafeApprovalMock', ['My Token', 'MTKN', cap]);
  await token.mint(holder, 1000n);
  return { holder, spender, other, token };
}

describe('ERC20SafeApproval', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  // -------------------------
  // Approval Cap Tests
  // -------------------------

  describe('approval cap', function () {
    it('returns the correct approval cap', async function () {
      expect(await this.token.getApprovalCap()).to.equal(cap);
    });

    it('allows approval at exactly the cap', async function () {
      await expect(this.token.connect(this.holder).approve(this.spender, cap))
        .to.not.be.reverted;
      expect(await this.token.allowance(this.holder, this.spender)).to.equal(cap);
    });

    it('allows approval below the cap', async function () {
      await expect(this.token.connect(this.holder).approve(this.spender, 100n))
        .to.not.be.reverted;
      expect(await this.token.allowance(this.holder, this.spender)).to.equal(100n);
    });

    it('reverts when approval exceeds the cap', async function () {
      await expect(this.token.connect(this.holder).approve(this.spender, cap + 1n))
        .to.be.revertedWithCustomError(this.token, 'ERC20ApprovalCapExceeded')
        .withArgs(cap + 1n, cap);
    });

    it('allows any approval amount when cap is set to max uint256', async function () {
      await this.token.setApprovalCap(ethers.MaxUint256);
      await expect(this.token.connect(this.holder).approve(this.spender, ethers.MaxUint256))
        .to.not.be.reverted;
    });

    it('emits ApprovalCapUpdated when cap is changed', async function () {
      await expect(this.token.setApprovalCap(1000n))
        .to.emit(this.token, 'ApprovalCapUpdated')
        .withArgs(cap, 1000n);
      expect(await this.token.getApprovalCap()).to.equal(1000n);
    });

    it('enforces updated cap on new approvals', async function () {
      await this.token.setApprovalCap(200n);
      await expect(this.token.connect(this.holder).approve(this.spender, 201n))
        .to.be.revertedWithCustomError(this.token, 'ERC20ApprovalCapExceeded')
        .withArgs(201n, 200n);
    });

    it('allows transferFrom within cap and allowance', async function () {
      await this.token.connect(this.holder).approve(this.spender, 100n);
      await expect(this.token.connect(this.spender).transferFrom(this.holder, this.other, 50n))
        .to.not.be.reverted;
      expect(await this.token.balanceOf(this.other)).to.equal(50n);
    });
  });

  // -------------------------
  // Approval Expiry Tests
  // -------------------------

  describe('approval expiration', function () {
    it('sets expiry correctly with approveWithExpiration', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry);
      expect(await this.token.getApprovalExpiry(this.holder, this.spender)).to.equal(expiry);
      expect(await this.token.allowance(this.holder, this.spender)).to.equal(100n);
    });

    it('emits ApprovalWithExpiration event', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await expect(this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry))
        .to.emit(this.token, 'ApprovalWithExpiration')
        .withArgs(this.holder.address, this.spender.address, 100n, expiry);
    });

    it('reverts when expiry is in the past', async function () {
      const pastExpiry = BigInt(await time.latest()) - 1n;
      await expect(this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, pastExpiry))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidExpiration')
        .withArgs(pastExpiry);
    });

    it('reverts when expiry is current timestamp', async function () {
      const now = BigInt(await time.latest());
      await expect(this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, now))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidExpiration')
        .withArgs(now);
    });

    it('allows transferFrom before expiry', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry);
      await expect(this.token.connect(this.spender).transferFrom(this.holder, this.other, 50n))
        .to.not.be.reverted;
      expect(await this.token.balanceOf(this.other)).to.equal(50n);
    });

    it('reverts transferFrom after expiry', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry);

      await time.increaseTo(expiry + 1n);

      await expect(this.token.connect(this.spender).transferFrom(this.holder, this.other, 50n))
        .to.be.revertedWithCustomError(this.token, 'ERC20ApprovalExpired')
        .withArgs(this.holder.address, this.spender.address, expiry);
    });

    it('isApprovalExpired returns false before expiry', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry);
      expect(await this.token.isApprovalExpired(this.holder, this.spender)).to.equal(false);
    });

    it('isApprovalExpired returns true after expiry', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry);
      await time.increaseTo(expiry + 1n);
      expect(await this.token.isApprovalExpired(this.holder, this.spender)).to.equal(true);
    });

    it('normal approve clears any existing expiry', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await this.token.connect(this.holder).approveWithExpiration(this.spender, 100n, expiry);

      // Re-approve without expiry
      await this.token.connect(this.holder).approve(this.spender, 100n);
      expect(await this.token.getApprovalExpiry(this.holder, this.spender)).to.equal(0n);

      // transferFrom should work even after original expiry passes
      await time.increaseTo(expiry + 1n);
      await expect(this.token.connect(this.spender).transferFrom(this.holder, this.other, 50n))
        .to.not.be.reverted;
    });
  });

  // -------------------------
  // Combined Tests
  // -------------------------

  describe('cap and expiry combined', function () {
    it('reverts approveWithExpiration above cap', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await expect(this.token.connect(this.holder).approveWithExpiration(this.spender, cap + 1n, expiry))
        .to.be.revertedWithCustomError(this.token, 'ERC20ApprovalCapExceeded')
        .withArgs(cap + 1n, cap);
    });

    it('allows approveWithExpiration at exactly the cap', async function () {
      const expiry = BigInt(await time.latest()) + 86400n;
      await expect(this.token.connect(this.holder).approveWithExpiration(this.spender, cap, expiry))
        .to.not.be.reverted;
      expect(await this.token.allowance(this.holder, this.spender)).to.equal(cap);
    });
  });
});