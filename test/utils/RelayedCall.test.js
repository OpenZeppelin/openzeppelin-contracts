const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { impersonate } = require('../helpers/account');

async function fixture() {
  const [admin, receiver, other] = await ethers.getSigners();

  const mock = await ethers.deployContract('$RelayedCall');
  const computeRelayerAddress = (salt = ethers.ZeroHash) =>
    ethers.getCreate2Address(
      mock.target,
      salt,
      ethers.keccak256(
        ethers.concat([
          '0x60475f8160095f39f373',
          mock.target,
          '0x331460133611166022575f5ffd5b6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e5f3d91604557fd5bf3',
        ]),
      ),
    );

  const authority = await ethers.deployContract('$AccessManager', [admin]);
  const target = await ethers.deployContract('$AccessManagedTarget', [authority]);

  return { mock, target, receiver, other, computeRelayerAddress };
}

describe('RelayedCall', function () {
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
        const tx = this.mock.$relayCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnUnrestricted', [])),
        );
        await expect(tx)
          .to.emit(this.target, 'CalledUnrestricted')
          .withArgs(this.relayer)
          .to.emit(this.mock, 'return$relayCall_address_bytes')
          .withArgs(true, '0x');
      });

      it('target success (with value)', async function () {
        const value = 42n;

        const tx = this.mock.$relayCall(
          ethers.Typed.address(this.receiver),
          ethers.Typed.uint256(value),
          ethers.Typed.bytes('0x'),
          ethers.Typed.overrides({ value }),
        );

        await expect(tx).to.changeEtherBalances([this.mock, this.relayer, this.receiver], [0n, 0n, value]);
        await expect(tx).to.emit(this.mock, 'return$relayCall_address_uint256_bytes').withArgs(true, '0x');
      });

      it('target revert', async function () {
        const tx = this.mock.$relayCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnRestricted', [])),
        );

        await expect(tx)
          .to.emit(this.mock, 'return$relayCall_address_bytes')
          .withArgs(false, this.target.interface.encodeErrorResult('AccessManagedUnauthorized', [this.relayer]));
      });
    });

    it('direct call to the relayer', async function () {
      // deploy relayer
      await this.mock.$getRelayer();

      // unauthorized caller
      await expect(
        this.other.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
      ).to.be.revertedWithoutReason();
    });

    it('input format', async function () {
      // deploy relayer
      await this.mock.$getRelayer();

      // impersonate mock to pass caller checks
      const mockAsWallet = await impersonate(this.mock.target);

      // 20 bytes (address + empty data) - OK
      await expect(
        mockAsWallet.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
      ).to.not.be.reverted;

      // 19 bytes (not enough for an address) - REVERT
      await expect(
        mockAsWallet.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce5' }),
      ).to.be.revertedWithoutReason();

      // 0 bytes (not enough for an address) - REVERT
      await expect(mockAsWallet.sendTransaction({ to: this.relayer, data: '0x' })).to.be.revertedWithoutReason();
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
        const tx = this.mock.$relayCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnUnrestricted', [])),
          ethers.Typed.bytes32(this.salt),
        );
        await expect(tx)
          .to.emit(this.target, 'CalledUnrestricted')
          .withArgs(this.relayer)
          .to.emit(this.mock, 'return$relayCall_address_bytes_bytes32')
          .withArgs(true, '0x');
      });

      it('target success (with value)', async function () {
        const value = 42n;

        const tx = this.mock.$relayCall(
          ethers.Typed.address(this.receiver),
          ethers.Typed.uint256(value),
          ethers.Typed.bytes('0x'),
          ethers.Typed.bytes32(this.salt),
          ethers.Typed.overrides({ value }),
        );

        await expect(tx).to.changeEtherBalances([this.mock, this.relayer, this.receiver], [0n, 0n, value]);
        await expect(tx).to.emit(this.mock, 'return$relayCall_address_uint256_bytes_bytes32').withArgs(true, '0x');
      });

      it('target revert', async function () {
        const tx = this.mock.$relayCall(
          ethers.Typed.address(this.target),
          ethers.Typed.bytes(this.target.interface.encodeFunctionData('fnRestricted', [])),
          ethers.Typed.bytes32(this.salt),
        );

        await expect(tx)
          .to.emit(this.mock, 'return$relayCall_address_bytes_bytes32')
          .withArgs(false, this.target.interface.encodeErrorResult('AccessManagedUnauthorized', [this.relayer]));
      });
    });

    it('direct call to the relayer', async function () {
      // deploy relayer
      await this.mock.$getRelayer(ethers.Typed.bytes32(this.salt));

      // unauthorized caller
      await expect(
        this.other.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
      ).to.be.revertedWithoutReason();
    });

    it('input format', async function () {
      // deploy relayer
      await this.mock.$getRelayer(ethers.Typed.bytes32(this.salt));

      // impersonate mock to pass caller checks
      const mockAsWallet = await impersonate(this.mock.target);

      // 20 bytes (address + empty data) - OK
      await expect(
        mockAsWallet.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
      ).to.not.be.reverted;

      // 19 bytes (not enough for an address) - REVERT
      await expect(
        mockAsWallet.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce5' }),
      ).to.be.revertedWithoutReason();

      // 0 bytes (not enough for an address) - REVERT
      await expect(mockAsWallet.sendTransaction({ to: this.relayer, data: '0x' })).to.be.revertedWithoutReason();
    });
  });
});
