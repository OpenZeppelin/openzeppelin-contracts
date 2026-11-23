import { artifacts, network } from 'hardhat';
import { expect } from 'chai';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const value = 42n;

async function fixture() {
  const [receiver, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$SimulateCall');
  const artifact = await artifacts.readArtifact('contracts/utils/SimulateCall.yul:SimulationRelayer');
  const simulator = ethers.getCreate2Address(mock.target, ethers.ZeroHash, ethers.keccak256(artifact.bytecode));

  const target = await ethers.deployContract('$CallReceiverMock');

  // fund the mock contract (for tests that use value)
  await other.sendTransaction({ to: mock, value });

  return { mock, target, receiver, other, artifact, simulator };
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
    await expect(ethers.provider.getCode(this.simulator)).to.eventually.equal(this.artifact.deployedBytecode);
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

    it('target invalid opcode', async function () {
      // `invalid()` consumes all the gas forwarded to the target and returns no data. The simulator keeps 1/64th of its
      // gas, which is enough to process the failure. The call is reported as a failure with empty revert data.
      const txPromise = this.mock.$simulateCall(
        ethers.Typed.address(this.target),
        ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionInvalid')),
      );

      await expect(txPromise).to.changeEtherBalances(ethers, [this.mock, this.simulator, this.target], [0n, 0n, 0n]);
      await expect(txPromise).to.emit(this.mock, 'return$simulateCall_address_bytes').withArgs(false, '0x');
    });

    describe('returndata bomb', function () {
      // CallReceiverMock's bomb functions return (or revert with) memory starting at 0, which includes the free memory
      // pointer (0x80) at 0x40.
      const bombData = length =>
        ethers.zeroPadBytes(ethers.concat([ethers.ZeroHash, ethers.ZeroHash, ethers.toBeHex(0x80, 32)]), length);

      const simulateBomb = ({ mock, target }, success, length) =>
        mock.$simulateCall(
          ethers.Typed.address(target),
          ethers.Typed.bytes(
            target.interface.encodeFunctionData(success ? 'mockFunctionReturnBomb' : 'mockFunctionRevertBomb', [
              length,
            ]),
          ),
          { gasLimit: 1_000_000n },
        );

      it('"tiny" return bomb', async function () {
        // 10kB: small enough that the full copy and the return event's LOG fit the gas budget, so the call succeeds
        // with the data in full. Unlike a revert bomb (capped at 2048 bytes), a successful return is not truncated.
        await expect(simulateBomb(this, true, 10_000))
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(true, bombData(10_000));
      });

      it('"small" return bomb', async function () {
        // 100kB: the target (~50k gas) and the simulator's full copy fit in the gas budget, so the library call succeeds
        // with the full return data (~190k gas in total). The transaction then runs out of gas when the `$simulateCall`
        // wrapper emits that data in its return event (~800k gas for the LOG alone).
        await expect(simulateBomb(this, true, 100_000)).to.be.revert(ethers);
      });

      it('"medium" return bomb', async function () {
        // 500kB: the target can afford the memory expansion (~545k gas), but the simulator, left with the gas the target
        // did not use, cannot afford the same memory expansion to copy the full return data on its success path. The
        // simulator runs out of gas, which the library reports as a success, with empty return data.
        await expect(simulateBomb(this, true, 500_000))
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(true, '0x');
      });

      it('"large" return bomb', async function () {
        // 2MB: the target cannot afford the memory expansion (~7.8M gas) and runs out of gas, without any return data.
        // The call is reported as a failure with empty return data.
        await expect(simulateBomb(this, true, 2_000_000))
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(false, '0x');
      });

      it('"small" revert bomb', async function () {
        // 100kB: the target can afford the memory expansion, and the simulator only copies the first 2048 bytes of the
        // revert data, which it can always afford. The call is reported as a failure with truncated revert data.
        await expect(simulateBomb(this, false, 100_000))
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(false, bombData(2048));
      });

      it('"medium" revert bomb', async function () {
        // 500kB: the target can afford the memory expansion (~545k gas). Contrary to the "medium" return bomb, the
        // simulator only copies the first 2048 bytes of the revert data, which it can afford with the gas the target did
        // not use. The call is reported as a failure with truncated revert data.
        await expect(simulateBomb(this, false, 500_000))
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(false, bombData(2048));
      });

      it('"large" revert bomb', async function () {
        // 2MB: the target cannot afford the memory expansion (~7.8M gas) and runs out of gas, without any revert data.
        // The call is reported as a failure with empty revert data.
        await expect(simulateBomb(this, false, 2_000_000))
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(false, '0x');
      });
    });
  });
});
