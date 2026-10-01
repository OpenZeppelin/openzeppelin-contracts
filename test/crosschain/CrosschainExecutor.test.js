import { network } from 'hardhat';
import { ethers } from 'ethers';
import { expect } from 'chai';

import { ERC7786Bridge } from '../helpers/erc7786';
import {
  CALL_TYPE_CALL,
  CALL_TYPE_BATCH,
  CALL_TYPE_DELEGATE,
  encodeMode,
  encodeSingle,
  encodeBatch,
  encodeDelegate,
} from '../helpers/erc7579';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

async function fixture() {
  // the controller is on chain A, the executor (and everything it operates on) is on chain B
  const [admin, other] = await chainA.ethers.getSigners();
  const gatewayA = bridge.gateway(chainA);
  const gatewayB = bridge.gateway(chainB);

  const target = await chainB.ethers.deployContract('CallReceiverMock');
  const executor = await chainB.ethers.deployContract('$CrosschainRemoteExecutor', [
    gatewayB,
    chainA.helpers.chain.toErc7930(admin),
  ]);

  // Send an instruction from chain A, and return the transaction that executes it on chain B.
  const remoteExecute = (from, target, mode, data) =>
    gatewayA
      .connect(from)
      .sendMessage(target, ethers.concat([mode, data]), [])
      .then(() => bridge.relay())
      .then(([tx]) => tx);

  return { target, executor, admin, other, remoteExecute };
}

describe('CrosschainRemoteController & CrosschainRemoteExecutor', function () {
  beforeEach(async function () {
    Object.assign(this, await bridge.loadFixture(fixture));
  });

  it('setup', async function () {
    await expect(this.executor.gateway()).to.eventually.equal(bridge.gateway(chainB));
    await expect(this.executor.controller()).to.eventually.equal(chainA.helpers.chain.toErc7930(this.admin));
  });

  describe('crosschain operation', function () {
    it('support single mode', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_CALL });
      const data = encodeSingle(this.target, 0n, this.target.interface.encodeFunctionData('mockFunctionExtra'));

      await expect(this.remoteExecute(this.admin, chainB.helpers.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.target, 'MockFunctionCalledExtra')
        .withArgs(this.executor, 0n);
    });

    it('support batch mode', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_BATCH });
      const data = encodeBatch(
        [this.target, 0n, this.target.interface.encodeFunctionData('mockFunctionWithArgs', [42, '0x1234'])],
        [this.target, 0n, this.target.interface.encodeFunctionData('mockFunctionExtra')],
      );

      await expect(this.remoteExecute(this.admin, chainB.helpers.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.target, 'MockFunctionCalledWithArgs')
        .withArgs(42, '0x1234')
        .to.emit(this.target, 'MockFunctionCalledExtra')
        .withArgs(this.executor, 0n);
    });

    it('support delegate mode', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_DELEGATE });
      const data = encodeDelegate(this.target, this.target.interface.encodeFunctionData('mockFunctionExtra'));

      await expect(this.remoteExecute(this.admin, chainB.helpers.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.target.attach(this.executor.target), 'MockFunctionCalledExtra')
        .withArgs(bridge.gateway(chainB), 0n);
    });

    it('revert when mode is invalid', async function () {
      const mode = encodeMode({ callType: '0x42' });
      const data = '0x';

      await expect(this.remoteExecute(this.admin, chainB.helpers.chain.toErc7930(this.executor), mode, data))
        .to.be.revertedWithCustomError(this.executor, 'ERC7579UnsupportedCallType')
        .withArgs('0x42');
    });
  });

  describe('reconfigure', function () {
    beforeEach(async function () {
      this.newGateway = await chainB.ethers.deployContract('$ERC7786GatewayMock');
    });

    it('through a crosschain call: success', async function () {
      const mode = encodeMode({ callType: CALL_TYPE_CALL });
      const data = encodeSingle(
        this.executor,
        0n,
        this.executor.interface.encodeFunctionData('reconfigure', [
          this.newGateway.target,
          chainA.helpers.chain.toErc7930(this.other),
        ]),
      );

      await expect(this.remoteExecute(this.admin, chainB.helpers.chain.toErc7930(this.executor), mode, data))
        .to.emit(this.executor, 'CrosschainControllerSet')
        .withArgs(this.newGateway, chainA.helpers.chain.toErc7930(this.other));

      await expect(this.executor.gateway()).to.eventually.equal(this.newGateway);
      await expect(this.executor.controller()).to.eventually.equal(chainA.helpers.chain.toErc7930(this.other));
    });

    it('through the internal setter: success', async function () {
      await expect(this.executor.$_setup(this.newGateway, chainA.helpers.chain.toErc7930(this.other)))
        .to.emit(this.executor, 'CrosschainControllerSet')
        .withArgs(this.newGateway, chainA.helpers.chain.toErc7930(this.other));

      await expect(this.executor.gateway()).to.eventually.equal(this.newGateway);
      await expect(this.executor.controller()).to.eventually.equal(chainA.helpers.chain.toErc7930(this.other));
    });

    it('with an invalid new gateway: revert', async function () {
      // directly using the internal setter
      await expect(this.executor.$_setup(this.other, chainA.helpers.chain.toErc7930(this.other))).to.revert(
        chainB.ethers,
      );

      // through a crosschain call
      const mode = encodeMode({ callType: CALL_TYPE_CALL });
      const data = encodeSingle(
        this.executor,
        0n,
        this.executor.interface.encodeFunctionData('reconfigure', [
          this.other.address,
          chainA.helpers.chain.toErc7930(this.other),
        ]),
      );

      await expect(
        this.remoteExecute(this.admin, chainB.helpers.chain.toErc7930(this.executor), mode, data),
      ).to.be.revertedWithCustomError(this.executor, 'FailedCall');
    });

    it('is access controlled', async function () {
      await expect(
        this.executor.reconfigure(this.newGateway, chainA.helpers.chain.toErc7930(this.other)),
      ).to.be.revertedWithCustomError(this.executor, 'AccessRestricted');
    });
  });
});
