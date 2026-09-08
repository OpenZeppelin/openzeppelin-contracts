import { ethers } from 'ethers';
import { expect } from 'chai';
import { anyValue } from '@nomicfoundation/hardhat-ethers-chai-matchers/withArgs';
import { RevertType } from '../helpers/enums';

const ids = [17n, 42n];
const values = [100n, 320n];

const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61';
const RECEIVER_BATCH_MAGIC_VALUE = '0xbc197c81';

export function shouldBehaveLikeBridgeERC1155({ chainAIsCustodial = false, chainBIsCustodial = false } = {}) {
  describe('bridge ERC1155 like', function () {
    beforeEach(function () {
      // helper: payload of a transfer coming from chain B
      this.encodePayload = (from, to, ids, values, data = '0x') =>
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256[]', 'uint256[]', 'bytes'],
          [this.chainB.helpers.chain.toErc7930(from), to.target ?? to.address ?? to, ids, values, data],
        );
    });

    it('bridge setup', async function () {
      await expect(this.bridgeA.getLink(this.chainB.helpers.chain.erc7930)).to.eventually.deep.equal([
        this.bridge.gateway(this.chainA).target,
        this.chainB.helpers.chain.toErc7930(this.bridgeB),
      ]);
      await expect(this.bridgeB.getLink(this.chainA.helpers.chain.erc7930)).to.eventually.deep.equal([
        this.bridge.gateway(this.chainB).target,
        this.chainA.helpers.chain.toErc7930(this.bridgeA),
      ]);
    });

    describe('crosschain send (both direction)', function () {
      it('single', async function () {
        const [alice, , chris] = this.accountsA;
        const [, bruce] = this.accountsB;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        // Alice sends tokens from chain A to Bruce on chain B.
        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256,uint256)')(
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids[0],
            values[0],
          ),
        )
          // bridge on chain A takes custody of the token
          .to.emit(this.tokenA, 'TransferSingle')
          .withArgs(
            chainAIsCustodial ? this.bridgeA : alice,
            alice,
            chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress,
            ids[0],
            values[0],
          )
          // crosschain transfer sent
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(
            anyValue,
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids.slice(0, 1),
            values.slice(0, 1),
            '0x',
          )
          // ERC-7786 event
          .to.emit(this.bridge.gateway(this.chainA), 'MessageSent');

        // The bridge delivers the message on chain B.
        await expect(this.bridge.relay().then(([tx]) => tx))
          // crosschain transfer received
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferReceived')
          .withArgs(
            anyValue,
            this.chainA.helpers.chain.toErc7930(alice),
            bruce,
            ids.slice(0, 1),
            values.slice(0, 1),
            '0x',
          )
          // tokens are minted on chain B
          .to.emit(this.tokenB, 'TransferSingle')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : this.bridge.gateway(this.chainB),
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            bruce,
            ids[0],
            values[0],
          );

        // Bruce sends tokens from chain B to Chris on chain A.
        await expect(
          this.bridgeB.connect(bruce).getFunction('crosschainTransferFrom(address,bytes,uint256,uint256)')(
            bruce,
            this.chainA.helpers.chain.toErc7930(chris),
            ids[0],
            values[0],
          ),
        )
          // tokens are burned on chain B
          .to.emit(this.tokenB, 'TransferSingle')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : bruce,
            bruce,
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            ids[0],
            values[0],
          )
          // crosschain transfer sent
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferSent')
          .withArgs(
            anyValue,
            bruce,
            this.chainA.helpers.chain.toErc7930(chris),
            ids.slice(0, 1),
            values.slice(0, 1),
            '0x',
          )
          // ERC-7786 event
          .to.emit(this.bridge.gateway(this.chainB), 'MessageSent');

        // The bridge delivers the message back on chain A.
        await expect(this.bridge.relay().then(([tx]) => tx))
          // crosschain transfer received
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferReceived')
          .withArgs(
            anyValue,
            this.chainB.helpers.chain.toErc7930(bruce),
            chris,
            ids.slice(0, 1),
            values.slice(0, 1),
            '0x',
          )
          // bridge on chain A releases custody of the token
          .to.emit(this.tokenA, 'TransferSingle')
          .withArgs(
            chainAIsCustodial ? this.bridgeA : this.bridge.gateway(this.chainA),
            chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress,
            chris,
            ids[0],
            values[0],
          );
      });

      it('batch', async function () {
        const [alice, , chris] = this.accountsA;
        const [, bruce] = this.accountsB;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        // Alice sends tokens from chain A to Bruce on chain B.
        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          // bridge on chain A takes custody of the token
          .to.emit(this.tokenA, 'TransferBatch')
          .withArgs(
            chainAIsCustodial ? this.bridgeA : alice,
            alice,
            chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress,
            ids,
            values,
          )
          // crosschain transfer sent
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), ids, values, '0x')
          // ERC-7786 event
          .to.emit(this.bridge.gateway(this.chainA), 'MessageSent');

        // The bridge delivers the message on chain B.
        await expect(this.bridge.relay().then(([tx]) => tx))
          // crosschain transfer received
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chainA.helpers.chain.toErc7930(alice), bruce, ids, values, '0x')
          // tokens are minted on chain B
          .to.emit(this.tokenB, 'TransferBatch')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : this.bridge.gateway(this.chainB),
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            bruce,
            ids,
            values,
          );

        // Bruce sends tokens from chain B to Chris on chain A.
        await expect(
          this.bridgeB.connect(bruce).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            bruce,
            this.chainA.helpers.chain.toErc7930(chris),
            ids,
            values,
          ),
        )
          // tokens are burned on chain B
          .to.emit(this.tokenB, 'TransferBatch')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : bruce,
            bruce,
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            ids,
            values,
          )
          // crosschain transfer sent
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, bruce, this.chainA.helpers.chain.toErc7930(chris), ids, values, '0x')
          // ERC-7786 event
          .to.emit(this.bridge.gateway(this.chainB), 'MessageSent');

        // The bridge delivers the message back on chain A.
        await expect(this.bridge.relay().then(([tx]) => tx))
          // crosschain transfer received
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chainB.helpers.chain.toErc7930(bruce), chris, ids, values, '0x')
          // bridge on chain A releases custody of the token
          .to.emit(this.tokenA, 'TransferBatch')
          .withArgs(
            chainAIsCustodial ? this.bridgeA : this.bridge.gateway(this.chainA),
            chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress,
            chris,
            ids,
            values,
          );
      });
    });

    describe('crosschain send with data', function () {
      beforeEach(async function () {
        // the receiver lives on the destination chain
        this.receiver = await this.chainB.ethers.deployContract('$ERC1155ReceiverMock', [
          RECEIVER_SINGLE_MAGIC_VALUE,
          RECEIVER_BATCH_MAGIC_VALUE,
          RevertType.None,
        ]);
        this.data = '0xdeadbeef';
      });

      it('single-token overload forwards data to the destination receive hook', async function () {
        const [alice] = this.accountsA;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256,uint256,bytes)')(
            alice,
            this.chainB.helpers.chain.toErc7930(this.receiver),
            ids[0],
            values[0],
            this.data,
          ),
        )
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(
            anyValue,
            alice,
            this.chainB.helpers.chain.toErc7930(this.receiver),
            ids.slice(0, 1),
            values.slice(0, 1),
            this.data,
          );

        await expect(this.bridge.relay().then(([tx]) => tx))
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferReceived')
          .withArgs(
            anyValue,
            this.chainA.helpers.chain.toErc7930(alice),
            this.receiver,
            ids.slice(0, 1),
            values.slice(0, 1),
            this.data,
          )
          .to.emit(this.receiver, 'BatchReceived')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : this.bridge.gateway(this.chainB),
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            ids.slice(0, 1),
            values.slice(0, 1),
            this.data,
            anyValue,
          );
      });

      it('batch overload forwards data to the destination receive hook', async function () {
        const [alice] = this.accountsA;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[],bytes)')(
            alice,
            this.chainB.helpers.chain.toErc7930(this.receiver),
            ids,
            values,
            this.data,
          ),
        )
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(this.receiver), ids, values, this.data);

        await expect(this.bridge.relay().then(([tx]) => tx))
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chainA.helpers.chain.toErc7930(alice), this.receiver, ids, values, this.data)
          .to.emit(this.receiver, 'BatchReceived')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : this.bridge.gateway(this.chainB),
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            ids,
            values,
            this.data,
            anyValue,
          );
      });
    });

    describe('transfer with allowance', function () {
      it('spender is owner', async function () {
        const [alice] = this.accountsA;
        const [, bruce] = this.accountsB;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), ids, values, '0x');
      });

      it('spender is allowed for all', async function () {
        const [alice, , chris] = this.accountsA;
        const [, bruce] = this.accountsB;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);
        await this.tokenA.connect(alice).setApprovalForAll(chris, true);

        await expect(
          this.bridgeA.connect(chris).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), ids, values, '0x');
      });
    });

    describe('invalid transfer', function () {
      it('missing allowance', async function () {
        const [alice, , chris] = this.accountsA;
        const [, bruce] = this.accountsB;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        // chris is not allowed
        await expect(
          this.bridgeA.connect(chris).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC1155MissingApprovalForAll')
          .withArgs(chris, alice);
      });

      it('insufficient balance', async function () {
        const [alice] = this.accountsA;
        const [, bruce] = this.accountsB;

        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chainB.helpers.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC1155InsufficientBalance')
          .withArgs(alice, 0n, values[0], ids[0]);
      });

      it('reverts if the address part of the interoperable address is empty', async function () {
        const [alice] = this.accountsA;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chainB.helpers.chain.toErc7930(undefined),
            ids,
            values,
          ), // No address
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainMultiTokenEmptyAddress');
      });
    });

    describe('restrictions', function () {
      it('only gateway can relay messages', async function () {
        const [notGateway] = this.accountsA;

        await expect(
          this.bridgeA
            .connect(notGateway)
            .receiveMessage(
              ethers.ZeroHash,
              this.chainB.helpers.chain.toErc7930(this.tokenB),
              this.encodePayload(notGateway, notGateway, ids, values),
            ),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientUnauthorizedGateway')
          .withArgs(notGateway, this.chainB.helpers.chain.toErc7930(this.tokenB));
      });

      it('only counterpart can send a crosschain message', async function () {
        const [invalid] = this.accountsA;

        // the gateway is the expected one, but the sender on chain B is not the registered counterpart
        await expect(
          this.bridge
            .gateway(this.chainA)
            .relayMessage(
              this.chainB.helpers.chain.toErc7930(invalid),
              this.chainA.helpers.chain.toErc7930(this.bridgeA),
              this.encodePayload(invalid, invalid, ids, values),
            ),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientUnauthorizedGateway')
          .withArgs(this.bridge.gateway(this.chainA), this.chainB.helpers.chain.toErc7930(invalid));
      });
    });

    describe('reconfiguration', function () {
      it('updating a link emits an event', async function () {
        const newGateway = await this.chainA.ethers.deployContract('$ERC7786GatewayMock');
        const newCounterpart = this.chainB.helpers.chain.toErc7930(this.accountsA[0]);

        await expect(this.bridgeA.$_setLink(newGateway, newCounterpart, true))
          .to.emit(this.bridgeA, 'LinkRegistered')
          .withArgs(newGateway, newCounterpart);

        await expect(this.bridgeA.getLink(this.chainB.helpers.chain.erc7930)).to.eventually.deep.equal([
          newGateway.target,
          newCounterpart,
        ]);
      });

      it('cannot override configuration if "allowOverride" is false', async function () {
        const newGateway = await this.chainA.ethers.deployContract('$ERC7786GatewayMock');
        const newCounterpart = this.chainB.helpers.chain.toErc7930(this.accountsA[0]);

        await expect(this.bridgeA.$_setLink(newGateway, newCounterpart, false))
          .to.be.revertedWithCustomError(this.bridgeA, 'LinkAlreadyRegistered')
          .withArgs(this.chainB.helpers.chain.erc7930);
      });

      it('reject invalid gateway', async function () {
        const notAGateway = this.accountsA[0];
        const newCounterpart = this.chainB.helpers.chain.toErc7930(this.accountsA[0]);

        await expect(this.bridgeA.$_setLink(notAGateway, newCounterpart, false)).to.be.revertedWithoutReason(ethers);
      });
    });
  });
}
