const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getLocalChain } = require('../helpers/chains');
const {
  CALL_TYPE_SINGLE,
  CALL_TYPE_BATCH,
  CALL_TYPE_DELEGATE,
  encodeMode,
  encodeSingle,
  encodeBatch,
  encodeDelegate,
} = require('../helpers/erc7579');

async function fixture() {
  const chain = await getLocalChain();
  const [admin, other] = await ethers.getSigners();

  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const target = await ethers.deployContract('CallReceiverMock');

  // Deploy executor
  const executor = await ethers.deployContract('$CrosschainRemoteExecutor', [gateway, chain.toErc7930(admin)]);

  const remoteExecute = (from, target, mode, data) =>
    gateway.connect(from).sendMessage(target, ethers.concat([mode, data]), []);

  return { chain, gateway, target, executor, admin, other, remoteExecute };
}

describe('CrosschainRemoteController & CrosschainRemoteExecutor', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('setup', async function () {
    await expect(this.executor.gateway()).to.eventually.equal(this.gateway);
    await expect(this.executor.controller()).to.eventually.equal(this.chain.toErc7930(this.admin));
  });

  describe('crosschain operation', function () {
    it('support single mode', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_SINGLE });
      const data = encodeSingle(this.target, 0n, this.target.interface.encodeFunctionData('mockFunctionExtra'));

      await expect(this.remoteExecute(this.admin, this.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.target, 'MockFunctionCalledExtra')
        .withArgs(this.executor, 0n);
    });

    it('support batch mode', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_BATCH });
      const data = encodeBatch(
        [this.target, 0n, this.target.interface.encodeFunctionData('mockFunctionWithArgs', [42, '0x1234'])],
        [this.target, 0n, this.target.interface.encodeFunctionData('mockFunctionExtra')],
      );

      await expect(this.remoteExecute(this.admin, this.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(42, '0x1234')
        .to.emit(this.target, 'MockFunctionCalledExtra')
        .withArgs(this.executor, 0n);
    });

    it('support delegate mode', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_DELEGATE });
      const data = encodeDelegate(this.target, this.target.interface.encodeFunctionData('mockFunctionExtra'));

      await expect(this.remoteExecute(this.admin, this.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.target.attach(this.executor.target), 'MockFunctionCalledExtra')
        .withArgs(this.gateway, 0n);
    });

    it('revert when mode is invalid', async function () {
      const mode = encodeMode({ callType: '0x42' });
      const data = '0x';

      await expect(this.remoteExecute(this.admin, this.chain.toErc7930(this.executor), mode, data))
        .to.be.revertedWithCustomError(this.executor, 'ERC7579UnsupportedCallType')
        .withArgs('0x42');
    });
  });

  describe('reconfigure', function () {
    beforeEach(async function () {
      this.newGateway = await ethers.deployContract('$ERC7786GatewayMock');
    });

    it('through a crosschain call: success', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_SINGLE });
      const data = encodeSingle(
        this.executor,
        0n,
        this.executor.interface.encodeFunctionData('reconfigure', [
          this.newGateway.target,
          this.chain.toErc7930(this.other),
        ]),
      );

      await expect(this.remoteExecute(this.admin, this.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.executor, 'CrosschainControllerSet')
        .withArgs(this.newGateway, this.chain.toErc7930(this.other));

      await expect(this.executor.gateway()).to.eventually.equal(this.newGateway);
      await expect(this.executor.controller()).to.eventually.equal(this.chain.toErc7930(this.other));
    });

    it('through the internal setter: success', async function () {
      await expect(this.executor.$_setup(this.newGateway, this.chain.toErc7930(this.other)))
        .to.emit(this.executor, 'CrosschainControllerSet')
        .withArgs(this.newGateway, this.chain.toErc7930(this.other));

      await expect(this.executor.gateway()).to.eventually.equal(this.newGateway);
      await expect(this.executor.controller()).to.eventually.equal(this.chain.toErc7930(this.other));
    });

    it('with an invalid new gateway: revert', async function () {
      // directly using the internal setter
      await expect(this.executor.$_setup(this.other, this.chain.toErc7930(this.other))).to.be.reverted;

      // through a crosschain call
      const mode = encodeMode({ callType: CALL_TYPE_SINGLE });
      const data = encodeSingle(
        this.executor,
        0n,
        this.executor.interface.encodeFunctionData('reconfigure', [
          this.other.address,
          this.chain.toErc7930(this.other),
        ]),
      );

      await expect(
        this.remoteExecute(this.admin, this.chain.toErc7930(this.executor), mode, data),
      ).to.be.revertedWithCustomError(this.executor, 'FailedCall');
    });

    it('is access controlled', async function () {
      await expect(
        this.executor.reconfigure(this.newGateway, this.chain.toErc7930(this.other)),
      ).to.be.revertedWithCustomError(this.executor, 'AccessRestricted');
    });
  });
});
