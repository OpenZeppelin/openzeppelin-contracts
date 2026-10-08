import { network } from 'hardhat';
import { expect } from 'chai';
import { readFileSync } from 'node:fs';

const CallSimulator = JSON.parse(readFileSync('artifacts/yul/CallSimulator.json', 'utf8'));
const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const value = 42n;

// Simulator bytecode embedded in SimulateCall.sol, copied from a fresh compile of contracts/utils/CallSimulator.yul.
// SIMULATOR_RUNTIME is a substring of SIMULATOR_INITCODE (initcode = creation stub + runtime).
const SIMULATOR_INITCODE =
  '0x603080600a5f395ff3fe60343610602c575f803660331901806034833781601435813560601c5af13d90815f803e6029575ff35b5ffd5b5f80fd';
const SIMULATOR_RUNTIME =
  '0x60343610602c575f803660331901806034833781601435813560601c5af13d90815f803e6029575ff35b5ffd5b5f80fd';

async function fixture() {
  const [receiver, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$SimulateCall');
  const simulator = ethers.getCreate2Address(mock.target, ethers.ZeroHash, ethers.keccak256(SIMULATOR_INITCODE));

  const target = await ethers.deployContract('$CallReceiverMock');

  // fund the mock contract (for tests that use value)
  await other.sendTransaction({ to: mock, value });

  return { mock, target, receiver, other, simulator };
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

  it('deploys the embedded simulator bytecode', async function () {
    await this.mock.$getSimulator();
    await expect(ethers.provider.getCode(this.simulator)).to.eventually.equal(SIMULATOR_RUNTIME);
  });

  // Compare the bytecode compiled from the .yul source against the embedded bytecode, so a change to the
  // .yul source that is not mirrored in SimulateCall.sol (and the constants above) is caught.
  it('syncs embedded simulator bytecode with .yul', function () {
    expect(CallSimulator.bytecode).to.equal(SIMULATOR_INITCODE);
    expect(CallSimulator.deployedBytecode).to.equal(SIMULATOR_RUNTIME);
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
