import { ethers } from 'ethers';
import { expect } from 'chai';
import { anyValue } from '@nomicfoundation/hardhat-ethers-chai-matchers/withArgs';

const tokenId = 42n;

export function shouldBehaveLikeBridgeERC721({ chainAIsCustodial = false, chainBIsCustodial = false } = {}) {
  describe('bridge ERC721 like', function () {
    beforeEach(function () {
      // helper: payload of a transfer coming from chain B
      this.encodePayload = (from, to, tokenId) =>
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256'],
          [this.chainB.helpers.chain.toErc7930(from), to.target ?? to.address ?? to, tokenId],
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

    it('crosschain send (both direction)', async function () {
      const [alice, , chris] = this.accountsA;
      const [, bruce] = this.accountsB;

      await this.tokenA.$_mint(alice, tokenId);
      await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

      // Alice sends tokens from chain A to Bruce on chain B.
      await expect(
        this.bridgeA.connect(alice).crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
      )
        // bridge on chain A takes custody of the token
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(alice, chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, tokenId)
        // crosschain transfer sent
        .to.emit(this.bridgeA, 'CrosschainNonFungibleTransferSent')
        .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId)
        // ERC-7786 event
        .to.emit(this.bridge.gateway(this.chainA), 'MessageSent');

      // The bridge delivers the message on chain B.
      await expect(this.bridge.relay().then(([tx]) => tx))
        // crosschain transfer received
        .to.emit(this.bridgeB, 'CrosschainNonFungibleTransferReceived')
        .withArgs(anyValue, this.chainA.helpers.chain.toErc7930(alice), bruce, tokenId)
        // tokens are minted on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress, bruce, tokenId);

      // Bruce sends tokens from chain B to Chris on chain A.
      await expect(
        this.bridgeB.connect(bruce).crosschainTransferFrom(bruce, this.chainA.helpers.chain.toErc7930(chris), tokenId),
      )
        // tokens are burned on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(bruce, chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress, tokenId)
        // crosschain transfer sent
        .to.emit(this.bridgeB, 'CrosschainNonFungibleTransferSent')
        .withArgs(anyValue, bruce, this.chainA.helpers.chain.toErc7930(chris), tokenId)
        // ERC-7786 event
        .to.emit(this.bridge.gateway(this.chainB), 'MessageSent');

      // The bridge delivers the message back on chain A.
      await expect(this.bridge.relay().then(([tx]) => tx))
        // crosschain transfer received
        .to.emit(this.bridgeA, 'CrosschainNonFungibleTransferReceived')
        .withArgs(anyValue, this.chainB.helpers.chain.toErc7930(bruce), chris, tokenId)
        // bridge on chain A releases custody of the token
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, chris, tokenId);
    });

    describe('transfer with allowance', function () {
      it('spender is owner', async function () {
        const [alice] = this.accountsA;
        const [, bruce] = this.accountsB;
        const tokenId = 17n;

        await this.tokenA.$_mint(alice, tokenId);
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA
            .connect(alice)
            .crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
        )
          .to.emit(this.bridgeA, 'CrosschainNonFungibleTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId);
      });

      it('spender is allowed for all', async function () {
        const [alice, , chris, david] = this.accountsA;
        const [, bruce] = this.accountsB;
        const tokenId = 17n;

        await this.tokenA.$_mint(alice, tokenId);
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);
        await this.tokenA.connect(alice).setApprovalForAll(chris, true);

        // david is not allowed
        await expect(
          this.bridgeA
            .connect(david)
            .crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC721InsufficientApproval')
          .withArgs(david, tokenId);

        // chris is allowed
        await expect(
          this.bridgeA
            .connect(chris)
            .crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
        )
          .to.emit(this.bridgeA, 'CrosschainNonFungibleTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId);
      });

      it('spender is allowed for specific token', async function () {
        const [alice, , chris] = this.accountsA;
        const [, bruce] = this.accountsB;
        const tokenId = 17n;
        const otherTokenId = 42n;

        await this.tokenA.$_mint(alice, tokenId);
        await this.tokenA.$_mint(alice, otherTokenId);
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);
        await this.tokenA.connect(alice).approve(chris, tokenId);

        // chris is not allowed to transfer otherTokenId
        await expect(
          this.bridgeA
            .connect(chris)
            .crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(bruce), otherTokenId),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC721InsufficientApproval')
          .withArgs(chris, otherTokenId);

        // chris is allowed to transfer tokenId
        await expect(
          this.bridgeA
            .connect(chris)
            .crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
        )
          .to.emit(this.bridgeA, 'CrosschainNonFungibleTransferSent')
          .withArgs(anyValue, alice, this.chainB.helpers.chain.toErc7930(bruce), tokenId);
      });
    });

    describe('invalid transfer', function () {
      it('token not minted', async function () {
        const [alice] = this.accountsA;
        const [, bruce] = this.accountsB;

        await expect(
          this.bridgeA
            .connect(alice)
            .crosschainTransferFrom(ethers.ZeroAddress, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC721NonexistentToken')
          .withArgs(tokenId);
      });

      it('incorrect from argument', async function () {
        const [alice, bruce] = this.accountsA;

        await this.tokenA.$_mint(alice, tokenId);
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);
        await this.tokenA.connect(alice).setApprovalForAll(bruce, true);

        await expect(
          this.bridgeA
            .connect(bruce)
            .crosschainTransferFrom(bruce, this.chainB.helpers.chain.toErc7930(bruce), tokenId),
        )
          .to.be.revertedWithCustomError(this.tokenA, 'ERC721IncorrectOwner')
          .withArgs(bruce, tokenId, alice);
      });

      it('reverts if the address part of the interoperable address is empty', async function () {
        const [alice] = this.accountsA;

        await this.tokenA.$_mint(alice, tokenId);
        await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

        await expect(
          this.bridgeA
            .connect(alice)
            .crosschainTransferFrom(alice, this.chainB.helpers.chain.toErc7930(undefined), tokenId), // No address
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainNonFungibleEmptyAddress');
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
              this.encodePayload(notGateway, notGateway, tokenId),
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
              this.encodePayload(invalid, invalid, tokenId),
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
