const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [admin, receiver] = await ethers.getSigners();

  const mock = await ethers.deployContract('$IndirectCall');
  const computeRelayerAddress = (salt = ethers.ZeroHash) =>
    ethers.getCreate2Address(mock.target, salt, '0x7bc0ea09c689dc0a6de3865d8789dae51a081efcf6569589ddae4b677df5dd3f');

  const authority = await ethers.deployContract('$AccessManager', [admin]);
  const target = await ethers.deployContract('$AccessManagedTarget', [authority]);

  return { mock, target, receiver, computeRelayerAddress };
}

describe('IndirectCall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('default (zero) salt', function () {
    beforeEach(async function () {
      this.relayer = await this.computeRelayerAddress();
    });

    it('automatic relayer deployment', async function () {
      await expect(ethers.provider.getCode(this.relayer)).to.eventually.equal('0x');

      // First call performs deployment
      await expect(this.mock.$getRelayer()).to.emit(this.mock, 'return$getRelayer').withArgs(this.relayer);

      await expect(ethers.provider.getCode(this.relayer)).to.eventually.not.equal('0x');

      // Following calls use the same relayer
      await expect(this.mock.$getRelayer()).to.emit(this.mock, 'return$getRelayer').withArgs(this.relayer);
    });

    describe('relayed call', function () {
      it('target success', async function () {
        const tx = this.mock.$indirectCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnUnrestricted', [])),
        );
        await expect(tx)
          .to.emit(this.target, 'CalledUnrestricted')
          .withArgs(this.relayer)
          .to.emit(this.mock, 'return$indirectCall_address_bytes')
          .withArgs(true, '0x');
      });

      it('target success (with value)', async function () {
        const value = 42n;

        const tx = this.mock.$indirectCall(
          ethers.Typed.address(this.receiver),
          ethers.Typed.uint256(value),
          ethers.Typed.bytes('0x'),
          ethers.Typed.overrides({ value }),
        );

        await expect(tx).to.changeEtherBalances([this.mock, this.relayer, this.receiver], [0n, 0n, value]);
        await expect(tx).to.emit(this.mock, 'return$indirectCall_address_uint256_bytes').withArgs(true, '0x');
      });

      it('target revert', async function () {
        const tx = this.mock.$indirectCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnRestricted', [])),
        );

        await expect(tx)
          .to.emit(this.mock, 'return$indirectCall_address_bytes')
          .withArgs(false, this.target.interface.encodeErrorResult('AccessManagedUnauthorized', [this.relayer]));
      });
    });

    it('direct call to the relayer', async function () {
      // deploy relayer
      await this.mock.$getRelayer();

      // 20 bytes (address + empty data) - OK
      await expect(
        this.mock.runner.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
      ).to.not.be.reverted;

      // 19 bytes (not enough for an address) - REVERT
      await expect(
        this.mock.runner.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce5' }),
      ).to.be.revertedWithoutReason();

      // 0 bytes (not enough for an address) - REVERT
      await expect(this.mock.runner.sendTransaction({ to: this.relayer, data: '0x' })).to.be.revertedWithoutReason();
    });
  });

  describe('random salt', function () {
    beforeEach(async function () {
      this.salt = ethers.hexlify(ethers.randomBytes(32));
      this.relayer = await this.computeRelayerAddress(this.salt);
    });

    it('automatic relayer deployment', async function () {
      await expect(ethers.provider.getCode(this.relayer)).to.eventually.equal('0x');

      // First call performs deployment
      await expect(this.mock.$getRelayer(ethers.Typed.bytes32(this.salt)))
        .to.emit(this.mock, 'return$getRelayer_bytes32')
        .withArgs(this.relayer);

      await expect(ethers.provider.getCode(this.relayer)).to.eventually.not.equal('0x');

      // Following calls use the same relayer
      await expect(this.mock.$getRelayer(ethers.Typed.bytes32(this.salt)))
        .to.emit(this.mock, 'return$getRelayer_bytes32')
        .withArgs(this.relayer);
    });

    describe('relayed call', function () {
      it('target success', async function () {
        const tx = this.mock.$indirectCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnUnrestricted', [])),
          ethers.Typed.bytes32(this.salt),
        );
        await expect(tx)
          .to.emit(this.target, 'CalledUnrestricted')
          .withArgs(this.relayer)
          .to.emit(this.mock, 'return$indirectCall_address_bytes_bytes32')
          .withArgs(true, '0x');
      });

      it('target success (with value)', async function () {
        const value = 42n;

        const tx = this.mock.$indirectCall(
          ethers.Typed.address(this.receiver),
          ethers.Typed.uint256(value),
          ethers.Typed.bytes('0x'),
          ethers.Typed.bytes32(this.salt),
          ethers.Typed.overrides({ value }),
        );

        await expect(tx).to.changeEtherBalances([this.mock, this.relayer, this.receiver], [0n, 0n, value]);
        await expect(tx).to.emit(this.mock, 'return$indirectCall_address_uint256_bytes_bytes32').withArgs(true, '0x');
      });

      it('target revert', async function () {
        const tx = this.mock.$indirectCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnRestricted', [])),
          ethers.Typed.bytes32(this.salt),
        );

        await expect(tx)
          .to.emit(this.mock, 'return$indirectCall_address_bytes_bytes32')
          .withArgs(false, this.target.interface.encodeErrorResult('AccessManagedUnauthorized', [this.relayer]));
      });
    });

    it('direct call to the relayer', async function () {
      // deploy relayer
      await this.mock.$getRelayer(ethers.Typed.bytes32(this.salt));

      // 20 bytes (address + empty data) - OK
      await expect(
        this.mock.runner.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
      ).to.not.be.reverted;

      // 19 bytes (not enough for an address) - REVERT
      await expect(
        this.mock.runner.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce5' }),
      ).to.be.revertedWithoutReason();

      // 0 bytes (not enough for an address) - REVERT
      await expect(this.mock.runner.sendTransaction({ to: this.relayer, data: '0x' })).to.be.revertedWithoutReason();
    });
  });
});
