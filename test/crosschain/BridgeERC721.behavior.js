const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const tokenId = 42n;

function shouldBehaveLikeBridgeERC721({ chainAIsCustodial = false, chainBIsCustodial = false } = {}) {
  describe('bridge ERC721 like', function () {
    beforeEach(function () {
      // helper
      this.encodePayload = (from, to, tokenId) =>
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256'],
          [this.chain.toErc7930(from), to.target ?? to.address ?? to, tokenId],
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

    it('crosschain send (both direction)', async function () {
      const [alice, bruce, chris] = this.accounts;

      await this.tokenA.$_mint(alice, tokenId);
      await this.tokenA.connect(alice).setApprovalForAll(this.bridgeA, true);

      // Alice sends tokens from chain A to Bruce on chain B.
      await expect(this.bridgeA.connect(alice).crosschainTransfer(this.chain.toErc7930(bruce), tokenId))
        // bridge on chain A takes custody of the token
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(alice, chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, tokenId)
        // crosschain transfer sent
        .to.emit(this.bridgeA, 'CrosschainERC721TransferSent')
        .withArgs(anyValue, alice, this.chain.toErc7930(bruce), tokenId)
        // ERC-7786 event
        .to.emit(this.gateway, 'MessageSent')
        // crosschain transfer received
        .to.emit(this.bridgeB, 'CrosschainERC721TransferReceived')
        .withArgs(anyValue, this.chain.toErc7930(alice), bruce, tokenId)
        // tokens are minted on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress, bruce, tokenId);

      // Bruce sends tokens from chain B to Chris on chain A.
      await expect(this.bridgeB.connect(bruce).crosschainTransfer(this.chain.toErc7930(chris), tokenId))
        // tokens are burned on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(bruce, chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress, tokenId)
        // crosschain transfer sent
        .to.emit(this.bridgeB, 'CrosschainERC721TransferSent')
        .withArgs(anyValue, bruce, this.chain.toErc7930(chris), tokenId)
        // ERC-7786 event
        .to.emit(this.gateway, 'MessageSent')
        // crosschain transfer received
        .to.emit(this.bridgeA, 'CrosschainERC721TransferReceived')
        .withArgs(anyValue, this.chain.toErc7930(bruce), chris, tokenId)
        // bridge on chain A releases custody of the token
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, chris, tokenId);
    });

    describe('restrictions', function () {
      beforeEach(async function () {
        await this.tokenA.$_mint(this.bridgeA, 1_000_000_000n);
      });

      it('only gateway can relay messages', async function () {
        const [notGateway] = this.accounts;

        await expect(
          this.bridgeA
            .connect(notGateway)
            .receiveMessage(
              ethers.ZeroHash,
              this.chain.toErc7930(this.tokenB),
              this.encodePayload(notGateway, notGateway, tokenId),
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
            .sendMessage(this.chain.toErc7930(this.bridgeA), this.encodePayload(invalid, invalid, tokenId), []),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientUnauthorizedGateway')
          .withArgs(this.gateway, this.chain.toErc7930(invalid));
      });

      it('cannot replay message', async function () {
        const [from, to] = this.accounts;

        const id = ethers.ZeroHash;
        const payload = this.encodePayload(from, to, tokenId);

        if (chainAIsCustodial) {
          await this.tokenA.$_mint(this.bridgeA, tokenId);
        }

        // first time works
        await expect(
          this.bridgeA.connect(this.gatewayAsEOA).receiveMessage(id, this.chain.toErc7930(this.bridgeB), payload),
        ).to.emit(this.bridgeA, 'CrosschainERC721TransferReceived');

        // second time fails
        await expect(
          this.bridgeA.connect(this.gatewayAsEOA).receiveMessage(id, this.chain.toErc7930(this.bridgeB), payload),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientMessageAlreadyProcessed')
          .withArgs(this.gateway, id);
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

      it('cannot override configuration is "allowOverride" is false', async function () {
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
  shouldBehaveLikeBridgeERC721,
};
