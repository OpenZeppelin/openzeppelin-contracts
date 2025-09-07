const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RemoteExecutor", function () {
  let remoteExecutor, target;
  let owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const RemoteExecutorFactory = await ethers.getContractFactory("RemoteExecutor");
    remoteExecutor = await RemoteExecutorFactory.deploy(owner.address);
    await remoteExecutor.waitForDeployment();
    
    const TargetFactory = await ethers.getContractFactory("Target");
    target = await TargetFactory.deploy();
    await target.waitForDeployment();
  });

  it("executes remote call successfully", async function () {
    const data = target.interface.encodeFunctionData("setValue", [42]);
    await remoteExecutor.execute(await target.getAddress(), data);
    expect(await target.value()).to.equal(42);
  });

  it("reverts if non-owner calls execute", async function () {
    const data = target.interface.encodeFunctionData("setValue", [42]);
    await expect(
      remoteExecutor.connect(addr1).execute(await target.getAddress(), data)
    ).to.be.revertedWithCustomError(remoteExecutor, "OwnableUnauthorizedAccount")
      .withArgs(addr1.address);
  });

  it("reverts if target is zero address", async function () {
    await expect(
      remoteExecutor.execute(ethers.ZeroAddress, "0x")
    ).to.be.revertedWith("RemoteExecutor: target is zero address");
  });

  it("reverts if call fails", async function () {
    await expect(
      remoteExecutor.execute(await target.getAddress(), "0x")
    ).to.be.revertedWith("RemoteExecutor: call failed");
  });

  it("returns call result from target function", async function () {
    const data = target.interface.encodeFunctionData("setValue", [123]);
    await remoteExecutor.execute(await target.getAddress(), data);
    expect(await target.value()).to.equal(123);
  });
});