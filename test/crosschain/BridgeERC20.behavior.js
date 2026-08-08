const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const amount = 100n;

function shouldBehaveLikeBridgeERC20({ chainAIsCustodial = false, chainBIsCustodial = false } = {}) {
  describe('bridge ERC20 like', function () {
    beforeEach(function () {
      // helper
      this.encodePayload = (from, to, amount) =>
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256'],
          [this.chain.toErc7930(from), to.target ?? to.address ?? to, amount],
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

      await this.tokenA.$_mint(alice, amount);
      await this.tokenA.connect(alice).approve(this.bridgeA, ethers.MaxUint256);

      // Alice sends tokens from chain A to Bruce on chain B.
      await expect(this.bridgeA.connect(alice).crosschainTransfer(this.chain.toErc7930(bruce), amount))
        // bridge on chain A takes custody of the funds
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(alice, chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, amount)
        // crosschain transfer sent
        .to.emit(this.bridgeA, 'CrosschainFungibleTransferSent')
        .withArgs(anyValue, alice, this.chain.toErc7930(bruce), amount)
        // ERC-7786 event
        .to.emit(this.gateway, 'MessageSent')
        // crosschain transfer received
        .to.emit(this.bridgeB, 'CrosschainFungibleTransferReceived')
        .withArgs(anyValue, this.chain.toErc7930(alice), bruce, amount)
        // crosschain mint event
        .to.emit(this.tokenB, 'CrosschainMint')
        .withArgs(bruce, amount, this.bridgeB)
        // tokens are minted on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress, bruce, amount);

      // Bruce sends tokens from chain B to Chris on chain A.
      await expect(this.bridgeB.connect(bruce).crosschainTransfer(this.chain.toErc7930(chris), amount))
        // tokens are burned on chain B
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(bruce, chainBIsCustodial ? this.bridgeB : ethers.ZeroAddress, amount)
        // crosschain burn event
        .to.emit(this.tokenB, 'CrosschainBurn')
        .withArgs(bruce, amount, this.bridgeB)
        // crosschain transfer sent
        .to.emit(this.bridgeB, 'CrosschainFungibleTransferSent')
        .withArgs(anyValue, bruce, this.chain.toErc7930(chris), amount)
        // ERC-7786 event
        .to.emit(this.gateway, 'MessageSent')
        // crosschain transfer received
        .to.emit(this.bridgeA, 'CrosschainFungibleTransferReceived')
        .withArgs(anyValue, this.chain.toErc7930(bruce), chris, amount)
        // bridge on chain A releases custody of the funds
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, chris, amount);
    });

    describe('invalid transfer', function () {
      // ERC-7930 v1: version=0x0001, chainType=eip155(0x0000), then ref + addr TLVs.
      const encodeEip155Receiver = (chainId, addressBytes) => {
        let refHex = BigInt(chainId).toString(16);
        if (refHex.length % 2) refHex = `0${refHex}`;
        const ref = ethers.getBytes(`0x${refHex}`);
        const addr = ethers.getBytes(addressBytes);
        return ethers.concat([
          '0x0001',
          '0x0000',
          ethers.toBeHex(ref.length, 1),
          ref,
          ethers.toBeHex(addr.length, 1),
          addr,
        ]);
      };

      it('reverts if the address part of the interoperable address is empty', async function () {
        const [alice] = this.accounts;

        await this.tokenA.$_mint(alice, amount);
        await this.tokenA.connect(alice).approve(this.bridgeA, ethers.MaxUint256);

        await expect(
          this.bridgeA.connect(alice).crosschainTransfer(this.chain.toErc7930(undefined), amount), // No address
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainFungibleEmptyAddress');
      });

      it('reverts if an EIP-155 receiver address is not exactly 20 bytes', async function () {
        const [alice, bruce] = this.accounts;

        await this.tokenA.$_mint(alice, amount);
        await this.tokenA.connect(alice).approve(this.bridgeA, ethers.MaxUint256);

        // Without this check, send would lock tokens and the length-checked receive path would reject forever.
        const longReceiver = encodeEip155Receiver(
          this.chain.reference,
          ethers.zeroPadValue(bruce.address, 32),
        );

        await expect(
          this.bridgeA.connect(alice).crosschainTransfer(longReceiver, amount),
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainFungibleInvalidAddress');
      });

      it('reverts if an EIP-155 receiver is the zero address', async function () {
        const [alice] = this.accounts;

        await this.tokenA.$_mint(alice, amount);
        await this.tokenA.connect(alice).approve(this.bridgeA, ethers.MaxUint256);

        await expect(
          this.bridgeA.connect(alice).crosschainTransfer(this.chain.toErc7930(ethers.ZeroAddress), amount),
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainFungibleInvalidAddress');
      });
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
              this.encodePayload(notGateway, notGateway, amount),
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
            .sendMessage(this.chain.toErc7930(this.bridgeA), this.encodePayload(invalid, invalid, amount), []),
        )
          .to.be.revertedWithCustomError(this.bridgeA, 'ERC7786RecipientUnauthorizedGateway')
          .withArgs(this.gateway, this.chain.toErc7930(invalid));
      });

      it('rejects a receiver address that is not exactly 20 bytes', async function () {
        const [alice] = this.accounts;
        // a 32-byte receiver (e.g. a non-EVM address) must not be silently truncated
        const longReceiver = ethers.zeroPadValue(alice.address, 32);
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256'],
          [this.chain.toErc7930(alice), longReceiver, amount],
        );

        await expect(
          this.bridgeA
            .connect(this.gatewayAsEOA)
            .receiveMessage(ethers.ZeroHash, this.chain.toErc7930(this.bridgeB), payload),
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainFungibleInvalidAddress');
      });

      it('rejects a zero receiver address', async function () {
        const [alice] = this.accounts;
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes', 'bytes', 'uint256'],
          [this.chain.toErc7930(alice), ethers.ZeroAddress, amount],
        );

        await expect(
          this.bridgeA
            .connect(this.gatewayAsEOA)
            .receiveMessage(ethers.ZeroHash, this.chain.toErc7930(this.bridgeB), payload),
        ).to.be.revertedWithCustomError(this.bridgeA, 'CrosschainFungibleInvalidAddress');
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
  shouldBehaveLikeBridgeERC20,
};
