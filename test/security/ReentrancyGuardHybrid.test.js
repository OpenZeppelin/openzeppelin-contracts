const { expect } = require("chai");

describe("ReentrancyGuardHybrid", function () {
  let ReentrancyTarget, target;

  beforeEach(async function () {
    const ReentrancyTargetFactory = await ethers.getContractFactory(`
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.20;

      import {ReentrancyGuardHybrid} from "../../contracts/security/ReentrancyGuardHybrid.sol";

      contract ReentrancyTarget is ReentrancyGuardHybrid {
          function callAgain() public nonReentrant {
              this.callAgain();
          }
      }
    `);
    target = await ReentrancyTargetFactory.deploy();
  });

  it("should revert on direct reentrancy", async function () {
    await expect(target.callAgain())
      .to.be.revertedWith("ReentrancyGuardHybrid: reentrant call");
  });
});
