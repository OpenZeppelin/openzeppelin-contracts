const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const name = "TestToken";
const symbol = "TTKN";
const decimals = 18n;
const initialSupply = ethers.parseUnits("1000000", decimals);

async function fixture() {
  const [deployer, holder, recipient, controller, operator, other] = await ethers.getSigners();

  const AssetToken = await ethers.getContractFactory("ERC20Mock");
  const assetToken = await AssetToken.deploy(name, symbol, decimals);
  await assetToken.mint(holder.address, initialSupply);

  const ERC7540Vault = await ethers.getContractFactory("ERC7540Mock");
  const vault = await ERC7540Vault.deploy(assetToken.address);

  return { deployer, holder, recipient, controller, operator, other, assetToken, vault };
}

describe("ERC7540", function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe("Deployment", function () {
    it("Should initialize the correct asset token", async function () {
      expect(await this.vault.asset()).to.equal(this.assetToken.target);
    });

    it("Should set the correct initial decimals", async function () {
      expect(await this.vault.decimals()).to.equal(decimals);
    });
  });

  describe("Request Deposit", function () {
    it("Should create a deposit request", async function () {
      const depositAmount = ethers.parseUnits("100", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, depositAmount);

      const requestId = await this.vault
        .connect(this.holder)
        .requestDeposit(depositAmount, this.controller.address, this.holder.address);

      expect(await this.vault.pendingDepositRequest(requestId, this.controller.address)).to.equal(depositAmount);
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(
        this.vault.connect(this.holder).requestDeposit(0, this.controller.address, this.holder.address)
      ).to.be.revertedWithCustomError(this.vault, "ERC7540ZeroAssetsNotAllowed");
    });

    it("Should revert if sender is not authorized", async function () {
      const depositAmount = ethers.parseUnits("100", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, depositAmount);

      await expect(
        this.vault.connect(this.other).requestDeposit(depositAmount, this.controller.address, this.holder.address)
      ).to.be.revertedWithCustomError(this.vault, "ERC7540Unauthorized");
    });
  });

  describe("Request Redeem", function () {
    it("Should create a redeem request", async function () {
      const redeemAmount = ethers.parseUnits("50", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, redeemAmount);
      await this.vault.connect(this.holder).requestDeposit(redeemAmount, this.controller.address, this.holder.address);

      const requestId = await this.vault
        .connect(this.holder)
        .requestRedeem(redeemAmount, this.controller.address, this.holder.address);

      expect(await this.vault.pendingRedeemRequest(requestId, this.controller.address)).to.equal(redeemAmount);
    });

    it("Should revert if redeem amount is zero", async function () {
      await expect(
        this.vault.connect(this.holder).requestRedeem(0, this.controller.address, this.holder.address)
      ).to.be.revertedWithCustomError(this.vault, "ERC7540ZeroSharesNotAllowed");
    });

    it("Should revert if sender is not authorized", async function () {
      const redeemAmount = ethers.parseUnits("50", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, redeemAmount);
      await this.vault.connect(this.holder).requestDeposit(redeemAmount, this.controller.address, this.holder.address);

      await expect(
        this.vault.connect(this.other).requestRedeem(redeemAmount, this.controller.address, this.holder.address)
      ).to.be.revertedWithCustomError(this.vault, "ERC7540Unauthorized");
    });
  });

  describe("Claim Deposits and Redemptions", function () {
    beforeEach(async function () {
      this.depositAmount = ethers.parseUnits("200", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, this.depositAmount);
      await this.vault.connect(this.holder).requestDeposit(this.depositAmount, this.controller.address, this.holder.address);
    });

    it("Should allow a controller to claim a deposit", async function () {
      await expect(
        this.vault.connect(this.controller).deposit(this.depositAmount, this.holder.address, this.controller.address)
      ).to.not.be.reverted;
    });

    it("Should revert if the controller tries to claim more than claimable amount", async function () {
      await expect(
        this.vault.connect(this.controller).deposit(this.depositAmount + 1n, this.holder.address, this.controller.address)
      ).to.be.revertedWithCustomError(this.vault, "ERC7540InsufficientClaimable");
    });
  });

  describe("Operator Permissions", function () {
    it("Should allow a user to set an operator", async function () {
      await expect(this.vault.connect(this.holder).setOperator(this.operator.address, true))
        .to.emit(this.vault, "OperatorSet")
        .withArgs(this.holder.address, this.operator.address, true);

      expect(await this.vault.isOperator(this.holder.address, this.operator.address)).to.be.true;
    });

    it("Should allow an operator to perform actions on behalf of the owner", async function () {
      await this.vault.connect(this.holder).setOperator(this.operator.address, true);

      const depositAmount = ethers.parseUnits("50", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, depositAmount);

      await expect(
        this.vault.connect(this.operator).requestDeposit(depositAmount, this.controller.address, this.holder.address)
      ).to.not.be.reverted;
    });

    it("Should revert if an unapproved operator tries to perform an action", async function () {
      await expect(
        this.vault.connect(this.other).requestDeposit(100, this.controller.address, this.holder.address)
      ).to.be.revertedWithCustomError(this.vault, "ERC7540Unauthorized");
    });
  });

  describe("ERC-165 Interface Support", function () {
    it("Should support ERC-165", async function () {
      expect(await this.vault.supportsInterface("0x01ffc9a7")).to.be.true; // ERC-165 ID
    });

    it("Should support ERC-7540 operator methods", async function () {
      expect(await this.vault.supportsInterface("0xe3bc4e65")).to.be.true;
    });

    it("Should support ERC-7575", async function () {
      expect(await this.vault.supportsInterface("0x2f0a18c5")).to.be.true;
    });

    it("Should support async deposit vault", async function () {
      expect(await this.vault.supportsInterface("0xce3bbe50")).to.be.true;
    });

    it("Should support async redemption vault", async function () {
      expect(await this.vault.supportsInterface("0x620ee8e4")).to.be.true;
    });

    it("Should return false for unsupported interfaces", async function () {
      expect(await this.vault.supportsInterface("0x00000000")).to.be.false;
    });
  });

  describe("Reentrancy and Edge Cases", function () {
    it("Should prevent reentrancy attacks", async function () {
      // Implement tests to check for reentrancy if using a vulnerable function
    });

    it("Should handle large request amounts", async function () {
      const largeAmount = ethers.parseUnits("1000000000", decimals);
      await this.assetToken.connect(this.holder).approve(this.vault.target, largeAmount);

      await expect(
        this.vault.connect(this.holder).requestDeposit(largeAmount, this.controller.address, this.holder.address)
      ).to.not.be.reverted;
    });
  });
});
