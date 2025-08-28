const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReentrancyGuardHybrid", function () {
  let target;
  let owner, other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();

    const Target = await ethers.getContractFactory("ReentrancyTarget");
    target = await Target.deploy();
    await target.waitForDeployment();
  });

  describe("nonReentrant", function () {
    it("should allow a single call", async function () {
      await expect(target.callMe()).to.not.be.reverted;
    });

    it("should block reentrant call", async function () {
      await expect(target.callMe()).to.not.be.reverted;

      await expect(target.callAgain()).to.be.revertedWith(
        "ReentrancyGuardHybrid: reentrant call"
      );
    });
  });

  describe("nonReentrantNS", function () {
    it("should allow a single call", async function () {
      await expect(target.callMeNS()).to.not.be.reverted;
    });

    it("should block reentrant call in namespace", async function () {
      await expect(target.callMeNS()).to.not.be.reverted;

      await expect(target.callAgainNS()).to.be.revertedWith(
        "ReentrancyGuardHybrid: reentrant call (namespace)"
      );
    });
  });
});
