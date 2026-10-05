import { network } from 'hardhat';
import { expect } from 'chai';
import { getYulBytecode } from '../../scripts/compile-yul.js';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const value = 42n;

// Simulator bytecode hardcoded in SimulateCall.sol, used when forge is not available to compile SimulateCall.yul
const fallback = {
  prefix: '0x603080600a5f395ff3fe',
  deployedBytecode:
    '0x60343610602c575f803660331901806034833781601435813560601c5af13d5f803e6028573d5ff35b3d5ffd5b5f80fd',
};
fallback.bytecode = ethers.concat([fallback.prefix, fallback.deployedBytecode]);

async function fixture() {
  const [receiver, other] = await ethers.getSigners();

  const relayer = getYulBytecode('contracts/utils/SimulateCall.yul:SimulationRelayer');

  const mock = await ethers.deployContract('$SimulateCall');
  const simulator = ethers.getCreate2Address(
    mock.target,
    ethers.ZeroHash,
    ethers.keccak256((relayer ?? fallback).bytecode),
  );

  const target = await ethers.deployContract('$CallReceiverMock');

  // fund the mock contract (for tests that use value)
  await other.sendTransaction({ to: mock, value });

  return { mock, target, receiver, other, simulator, relayer };
}

describe('SimulateCall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('automatic simulator deployment', async function () {
    await expect(ethers.provider.getCode(this.simulator)).to.eventually.equal('0x');

    // First call performs deployment
    await expect(this.mock.$getSimulator()).to.emit(this.mock, 'return$getSimulator').withArgs(this.simulator);

    await expect(ethers.provider.getCode(this.simulator)).to.eventually.not.equal('0x');

    // Following calls use the same simulator
    await expect(this.mock.$getSimulator()).to.emit(this.mock, 'return$getSimulator').withArgs(this.simulator);
  });

  it('simulator bytecode matches the Yul source', async function () {
    if (!this.relayer) this.skip();

    expect(this.relayer.bytecode).to.equal(fallback.bytecode);
    expect(this.relayer.deployedBytecode).to.equal(fallback.deployedBytecode);

    await expect(this.mock.$getSimulator()).to.emit(this.mock, 'return$getSimulator').withArgs(this.simulator);
    await expect(ethers.provider.getCode(this.simulator)).to.eventually.equal(this.relayer.deployedBytecode);
  });

  describe('simulated call', function () {
    it('target success', async function () {
      const txPromise = this.mock.$simulateCall(
        ethers.Typed.address(this.target),
        ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [10, 20])),
      );

      await expect(txPromise).to.changeEtherBalances(ethers, [this.mock, this.simulator, this.target], [0n, 0n, 0n]);
      await expect(txPromise)
        .to.emit(this.mock, 'return$simulateCall_address_bytes')
        .withArgs(true, ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'uint256'], [10, 20]))
        .to.not.emit(this.target, 'MockFunctionCalledWithArgs');
    });

    it('target success (with value)', async function () {
      // perform simulated call
      const txPromise = this.mock.$simulateCall(
        ethers.Typed.address(this.target),
        ethers.Typed.uint256(value),
        ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionExtra')),
      );

      await expect(txPromise).to.changeEtherBalances(ethers, [this.mock, this.simulator, this.target], [0n, 0n, 0n]);
      await expect(txPromise)
        .to.emit(this.mock, 'return$simulateCall_address_uint256_bytes')
        .withArgs(true, ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [this.mock.target, value]))
        .to.not.emit(this.target, 'MockFunctionCalledExtra');
    });

    it('target revert', async function () {
      const txPromise = this.mock.$simulateCall(
        ethers.Typed.address(this.target),
        ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionRevertsReason')),
      );

      await expect(txPromise).to.changeEtherBalances(ethers, [this.mock, this.simulator, this.target], [0n, 0n, 0n]);
      await expect(txPromise)
        .to.emit(this.mock, 'return$simulateCall_address_bytes')
        .withArgs(false, this.target.interface.encodeErrorResult('Error', ['CallReceiverMock: reverting']));
    });

    it('target revert (with value)', async function () {
      const txPromise = this.mock.$simulateCall(
        ethers.Typed.address(this.target),
        ethers.Typed.uint256(value),
        ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionRevertsReason')),
      );

      await expect(txPromise).to.changeEtherBalances(ethers, [this.mock, this.simulator, this.target], [0n, 0n, 0n]);
      await expect(txPromise)
        .to.emit(this.mock, 'return$simulateCall_address_uint256_bytes')
        .withArgs(false, this.target.interface.encodeErrorResult('Error', ['CallReceiverMock: reverting']));
    });
  });
});
