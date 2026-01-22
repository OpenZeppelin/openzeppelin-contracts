const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [receiver, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$SimulateCall');
  const computeSimulatorAddress = (salt = ethers.ZeroHash) =>
    ethers.getCreate2Address(
      mock.target,
      salt,
      ethers.keccak256(
        ethers.concat([
          '0x602e5f8160095f39f3',
          '0x60133611600a575f5ffd5b6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e3d533d6001015ffd',
        ]),
      ),
    );

  const target = await ethers.deployContract('$CallReceiverMock');

  return { mock, target, receiver, other, computeSimulatorAddress };
}

describe('SimulateCall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('default (zero) salt', function () {
    beforeEach(async function () {
      this.simulator = await this.computeSimulatorAddress();
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
        const tx = this.mock.$simulateCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [10, 20])),
        );
        await expect(tx)
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(true, ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'uint256'], [10, 20]))
          .to.not.emit(this.target, 'MockFunctionCalledWithArgs');
      });

      it('target success (with value)', async function () {
        const value = 42n;

        // fund the mock
        await this.other.sendTransaction({ to: this.mock.target, value });

        // perform simulated call
        const tx = this.mock.$simulateCall(
          ethers.Typed.address(this.receiver),
          ethers.Typed.uint256(value),
          ethers.Typed.bytes('0x'),
        );

        await expect(tx).to.changeEtherBalances([this.mock, this.simulator, this.receiver], [0n, 0n, 0n]);
        await expect(tx).to.emit(this.mock, 'return$simulateCall_address_uint256_bytes').withArgs(true, '0x');
      });

      it('target revert', async function () {
        const tx = this.mock.$simulateCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionRevertsReason', [])),
        );

        await expect(tx)
          .to.emit(this.mock, 'return$simulateCall_address_bytes')
          .withArgs(false, this.target.interface.encodeErrorResult('Error', ['CallReceiverMock: reverting']));
      });
    });
  });

  describe('random salt', function () {
    beforeEach(async function () {
      this.salt = ethers.hexlify(ethers.randomBytes(32));
      this.simulator = await this.computeSimulatorAddress(this.salt);
    });

    it('automatic simulator deployment', async function () {
      await expect(ethers.provider.getCode(this.simulator)).to.eventually.equal('0x');

      // First call performs deployment
      await expect(this.mock.$getSimulator(ethers.Typed.bytes32(this.salt)))
        .to.emit(this.mock, 'return$getSimulator_bytes32')
        .withArgs(this.simulator);

      await expect(ethers.provider.getCode(this.simulator)).to.eventually.not.equal('0x');

      // Following calls use the same simulator
      await expect(this.mock.$getSimulator(ethers.Typed.bytes32(this.salt)))
        .to.emit(this.mock, 'return$getSimulator_bytes32')
        .withArgs(this.simulator);
    });

    describe('simulated call', function () {
      it('target success', async function () {
        const tx = this.mock.$simulateCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionWithArgsReturn', [10, 20])),
          ethers.Typed.bytes32(this.salt),
        );
        await expect(tx)
          .to.emit(this.mock, 'return$simulateCall_address_bytes_bytes32')
          .withArgs(true, ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'uint256'], [10, 20]))
          .to.not.emit(this.target, 'MockFunctionCalledWithArgs');
      });

      it('target success (with value)', async function () {
        const value = 42n;

        // fund the mock
        await this.other.sendTransaction({ to: this.mock.target, value });

        // perform simulated call
        const tx = this.mock.$simulateCall(
          ethers.Typed.address(this.receiver),
          ethers.Typed.uint256(value),
          ethers.Typed.bytes('0x'),
          ethers.Typed.bytes32(this.salt),
        );

        await expect(tx).to.changeEtherBalances([this.mock, this.simulator, this.receiver], [0n, 0n, 0n]);
        await expect(tx).to.emit(this.mock, 'return$simulateCall_address_uint256_bytes_bytes32').withArgs(true, '0x');
      });

      it('target revert', async function () {
        const tx = this.mock.$simulateCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('mockFunctionRevertsReason', [])),
          ethers.Typed.bytes32(this.salt),
        );

        await expect(tx)
          .to.emit(this.mock, 'return$simulateCall_address_bytes_bytes32')
          .withArgs(false, this.target.interface.encodeErrorResult('Error', ['CallReceiverMock: reverting']));
      });
    });
  });
});
