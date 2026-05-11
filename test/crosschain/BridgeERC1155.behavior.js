const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const ids = [17n, 42n];
const values = [100n, 320n];

function shouldBehaveLikeBridgeERC1155({ chainAIsCustodial = false, chainBIsCustodial = false } = {}) {
  describe('bridge ERC1155 like', function () {
    beforeEach(function () {
      // helper
      this.encodePayload = (from, to, ids, values) =>
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256[]', 'uint256[]'],
          [this.chain.toErc7930(from), to.target ?? to.address ?? to, ids, values],
        );
    });

    it('bridge setup', async function () {
      await expect(this.bridgeA.getLink(this.chain.erc7930)).to.eventually.deep.equal([
        this.gateway.target,
        this.chain.toErc7930(this.bridgeB),
      ]);
      await expect(this.bridgeB.getLink(this.chain.erc7930)).to.eventually.deep.equal([
        this.gateway.target,
        this.chain.toErc7930(this.bridgeA),
      ]);
    });

    describe('crosschain send (both direction)', async function () {
      it('single', async function () {
        const [alice, bruce, chris] = this.accounts;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        // Alice sends tokens from chain A to Bruce on chain B.
        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256,uint256)')(
            alice,
            this.chain.toErc7930(bruce),
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
          .withArgs(anyValue, alice, this.chain.toErc7930(bruce), ids.slice(0, 1), values.slice(0, 1))
          // ERC-7786 event
          .to.emit(this.gateway, 'MessageSent')
          // crosschain transfer received
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chain.toErc7930(alice), bruce, ids.slice(0, 1), values.slice(0, 1))
          // tokens are minted on chain B
          .to.emit(this.tokenB, 'TransferSingle')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : this.gateway,
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            bruce,
            ids[0],
            values[0],
          );

        // Bruce sends tokens from chain B to Chris on chain A.
        await expect(
          this.bridgeB.connect(bruce).getFunction('crosschainTransferFrom(address,bytes,uint256,uint256)')(
            bruce,
            this.chain.toErc7930(chris),
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
          .withArgs(anyValue, bruce, this.chain.toErc7930(chris), ids.slice(0, 1), values.slice(0, 1))
          // ERC-7786 event
          .to.emit(this.gateway, 'MessageSent')
          // crosschain transfer received
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chain.toErc7930(bruce), chris, ids.slice(0, 1), values.slice(0, 1))
          // bridge on chain A releases custody of the token
          .to.emit(this.tokenA, 'TransferSingle')
          .withArgs(
            chainAIsCustodial ? this.bridgeA : this.gateway,
            chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress,
            chris,
            ids[0],
            values[0],
          );
      });

      it('batch', async function () {
        const [alice, bruce, chris] = this.accounts;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        // Alice sends tokens from chain A to Bruce on chain B.
        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chain.toErc7930(bruce),
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
          .withArgs(anyValue, alice, this.chain.toErc7930(bruce), ids, values)
          // ERC-7786 event
          .to.emit(this.gateway, 'MessageSent')
          // crosschain transfer received
          .to.emit(this.bridgeB, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chain.toErc7930(alice), bruce, ids, values)
          // tokens are minted on chain B
          .to.emit(this.tokenB, 'TransferBatch')
          .withArgs(
            chainBIsCustodial ? this.bridgeB : this.gateway,
            chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress,
            bruce,
            ids,
            values,
          );

        // Bruce sends tokens from chain B to Chris on chain A.
        await expect(
          this.bridgeB.connect(bruce).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            bruce,
            this.chain.toErc7930(chris),
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
          .withArgs(anyValue, bruce, this.chain.toErc7930(chris), ids, values)
          // ERC-7786 event
          .to.emit(this.gateway, 'MessageSent')
          // crosschain transfer received
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferReceived')
          .withArgs(anyValue, this.chain.toErc7930(bruce), chris, ids, values)
          // bridge on chain A releases custody of the token
          .to.emit(this.tokenA, 'TransferBatch')
          .withArgs(
            chainAIsCustodial ? this.bridgeA : this.gateway,
            chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress,
            chris,
            ids,
            values,
          );
      });
    });

    describe('transfer with allowance', function () {
      it('spender is owner', async function () {
        const [alice, bruce] = this.accounts;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, alice, this.chain.toErc7930(bruce), ids, values);
      });

      it('spender is allowed for all', async function () {
        const [alice, bruce, chris] = this.accounts;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);
        await this.tokenA.connect(alice).setApprovalForAll(chris, true);

        await expect(
          this.bridgeA.connect(chris).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.emit(this.bridgeA, 'CrosschainMultiTokenTransferSent')
          .withArgs(anyValue, alice, this.chain.toErc7930(bruce), ids, values);
      });
    });

    describe('invalid transfer', function () {
      it('missing allowance', async function () {
        const [alice, bruce, chris] = this.accounts;

        await this.tokenA.$_mintBatch(alice, ids, values, '0x');
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        // chris is not allowed
        await expect(
          this.bridgeA.connect(chris).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC1155MissingApprovalForAll')
          .withArgs(chris, alice);
      });

      it('insufficient balance', async function () {
        const [alice, bruce] = this.accounts;

        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA.connect(alice).getFunction('crosschainTransferFrom(address,bytes,uint256[],uint256[])')(
            alice,
            this.chain.toErc7930(bruce),
            ids,
            values,
          ),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC1155InsufficientBalance')
          .withArgs(alice, 0n, values[0], ids[0]);
      });
    });

    describe('restrictions', function () {
      it('only gateway can relay messages', async function () {
        const [notGateway] = this.accounts;

        await expect(
          this.bridgeA
            .connect(notGateway)
            .receiveMessage(
              ethers.ZeroHash,
              this.chain.toErc7930(this.tokenB),
              this.encodePayload(notGateway, notGateway, ids, values),
            ),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientUnauthorizedGateway')
          .withArgs(notGateway, this.chain.toErc7930(this.tokenB));
      });

      it('only counterpart can send a crosschain message', async function () {
        const [invalid] = this.accounts;

        await expect(
          this.gateway
            .connect(invalid)
            .sendMessage(this.chain.toErc7930(this.bridgeA), this.encodePayload(invalid, invalid, ids, values), []),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientUnauthorizedGateway')
          .withArgs(this.gateway, this.chain.toErc7930(invalid));
      });
    });

    describe('reconfiguration', function () {
      it('updating a link emits an event', async function () {
        const newGateway = await ethers.deployContract('$ERC7786GatewayMock');
        const newCounterpart = this.chain.toErc7930(this.accounts[0]);

        await expect(this.bridgeA.$_setLink(newGateway, newCounterpart, true))
          .to.emit(this.bridgeA, 'LinkRegistered')
          .withArgs(newGateway, newCounterpart);

        await expect(this.bridgeA.getLink(this.chain.erc7930)).to.eventually.deep.equal([
          newGateway.target,
          newCounterpart,
        ]);
      });

      it('cannot override configuration if "allowOverride" is false', async function () {
        const newGateway = await ethers.deployContract('$ERC7786GatewayMock');
        const newCounterpart = this.chain.toErc7930(this.accounts[0]);

        await expect(this.bridgeA.$_setLink(newGateway, newCounterpart, false))
          .to.be.revertedWithCustomError(this.bridgeA, 'LinkAlreadyRegistered')
          .withArgs(this.chain.erc7930);
      });

      it('reject invalid gateway', async function () {
        const notAGateway = this.accounts[0];
        const newCounterpart = this.chain.toErc7930(this.accounts[0]);

        await expect(this.bridgeA.$_setLink(notAGateway, newCounterpart, false)).to.be.revertedWithoutReason();
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeBridgeERC1155,
};
