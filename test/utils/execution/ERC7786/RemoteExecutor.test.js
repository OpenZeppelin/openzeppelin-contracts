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

  it("reverts when calling contract with empty data (no fallback)", async function () {
    // Call with empty data reverts because Target contract has no fallback function
    await expect(
      remoteExecutor.execute(await target.getAddress(), "0x")
    ).to.be.revertedWith("RemoteExecutor: call failed");
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
    // Call a non-existent function to trigger a revert
    const invalidData = "0x12345678"; // Invalid function selector
    await expect(
      remoteExecutor.execute(await target.getAddress(), invalidData)
    ).to.be.reverted; // Will bubble up the actual revert reason
  });

  it("bubbles the target's revert reason when available", async function () {
    const data = target.interface.encodeFunctionData("revertFunction");
    await expect(
      remoteExecutor.execute(await target.getAddress(), data)
    ).to.be.revertedWith("Target: function reverts");
  });

  it("returns call result from target function", async function () {
    const data = target.interface.encodeFunctionData("setValue", [123]);
    await remoteExecutor.execute(await target.getAddress(), data);
    expect(await target.value()).to.equal(123);
  });

  it("returns correct value from view function", async function () {
    // Set value first
    const setData = target.interface.encodeFunctionData("setValue", [555]);
    await remoteExecutor.execute(await target.getAddress(), setData);

    // Call view function using staticCall to get return data
    const viewData = target.interface.encodeFunctionData("getValue");
    const [success, result] = await remoteExecutor.execute.staticCall(
      await target.getAddress(), 
      viewData
    );

    // Verify success and decode the returned value
    expect(success).to.be.true;
    const [returnedValue] = target.interface.decodeFunctionResult("getValue", result);
    expect(returnedValue).to.equal(555);
  });

  it("returns (true, bytes) and decodes correctly for view calls", async function () {
    // Prepare state
    await target.setValue(777);
    const data = target.interface.encodeFunctionData("getValue");
    
    // Use staticCall to test return values without state changes
    const [success, result] = await remoteExecutor.execute.staticCall(
      await target.getAddress(), 
      data
    );
    
    expect(success).to.equal(true);
    const [decoded] = target.interface.decodeFunctionResult("getValue", result);
    expect(decoded).to.equal(777);
  });

  it("handles successful execution with return data", async function () {
    // Test that execute returns proper success and result values
    const data = target.interface.encodeFunctionData("setValue", [999]);
    
    // Execute and verify state change
    await remoteExecutor.execute(await target.getAddress(), data);
    expect(await target.value()).to.equal(999);
    
    // Verify the function would return success=true if called statically
    const [success] = await remoteExecutor.execute.staticCall(
      await target.getAddress(), 
      data
    );
    expect(success).to.be.true;
  });
});