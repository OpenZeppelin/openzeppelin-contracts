import { network } from 'hardhat';
import { expect } from 'chai';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const value = 42n;

async function fixture() {
  const [receiver, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$SimulateCall');
  const simulator = ethers.getCreate2Address(
    mock.target,
    ethers.ZeroHash,
    ethers.keccak256(
      ethers.concat([
        '0x60475f8160095f39f3',
        '0x60333611600a575f5ffd5b6034360360345f375f5f603436035f6014355f3560601c5af1603f573d610800818110603557506038565b90505b805f5f3e5ff35b3d5f5f3e3d5ffd',
      ]),
    ),
  );

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

    it('target revert with bomb', async function () {
      const bomb = await ethers.deployContract('RevertBombMock');
      await this.mock.$simulateCall(ethers.Typed.address(this.target), ethers.Typed.bytes('0x')); // deploy simulator
      const txPromise = this.mock.$simulateCall(ethers.Typed.address(bomb), ethers.Typed.bytes('0x'), {
        gasLimit: 1_000_000n,
      });
      await expect(txPromise).to.emit(this.mock, 'return$simulateCall_address_bytes').withArgs(
        false, // reverting target is a failure (bounded copy can't be starved into an OOG)
        ethers.zeroPadBytes('0x', 2048), // failure; reason copied up to the 2048-byte cap
      );
    });
  });
});
