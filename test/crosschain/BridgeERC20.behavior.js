const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const amount = 100n;

function shouldBehaveLikeBridgeERC20({ chainAIsCustodial = false, chainBIsCustodial = false } = {}) {
  beforeEach(function () {
    // helper
    this.encodePayload = (from, to, amount) =>
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes', 'bytes', 'uint256'],
        [this.chain.toErc7930(from), to.target ?? to.address ?? to, amount],
      );
  });

  it('bridge setup', async function () {
    await expect(this.bridgeA.link(this.chain.erc7930)).to.eventually.deep.equal([
      this.gateway.target,
      this.chain.toErc7930(this.bridgeB),
    ]);
    await expect(this.bridgeB.link(this.chain.erc7930)).to.eventually.deep.equal([
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
      .to.emit(this.bridgeA, 'CrossChainTransferSent')
      .withArgs(anyValue, alice, this.chain.toErc7930(bruce), amount)
      // ERC-7786 event
      .to.emit(this.gateway, 'MessageSent')
      // crosschain transfer received
      .to.emit(this.bridgeB, 'CrossChainTransferReceived')
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
      .to.emit(this.bridgeB, 'CrossChainTransferSent')
      .withArgs(anyValue, bruce, this.chain.toErc7930(chris), amount)
      // ERC-7786 event
      .to.emit(this.gateway, 'MessageSent')
      // crosschain transfer received
      .to.emit(this.bridgeA, 'CrossChainTransferReceived')
      .withArgs(anyValue, this.chain.toErc7930(bruce), chris, amount)
      // bridge on chain A releases custody of the funds
      .to.emit(this.tokenA, 'Transfer')
      .withArgs(chainAIsCustodial ? this.bridgeA : ethers.ZeroAddress, chris, amount);
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
        .to.be.revertedWithCustomError(this.bridgeA, 'InvalidGatewayForChain')
        .withArgs(notGateway, this.chain.erc7930);
    });

    it('only remote can send a crosschain message', async function () {
      const [notRemote] = this.accounts;

      await expect(
        this.gateway
          .connect(notRemote)
          .sendMessage(this.chain.toErc7930(this.bridgeA), this.encodePayload(notRemote, notRemote, amount), []),
      )
        .to.be.revertedWithCustomError(this.bridgeA, 'InvalidRemoteForChain')
        .withArgs(this.chain.toErc7930(notRemote), this.chain.erc7930);
    });

    it('cannot replay message', async function () {
      const [from, to] = this.accounts;

      const id = ethers.ZeroHash;
      const payload = this.encodePayload(from, to, amount);

      // first time works
      await expect(
        this.bridgeA.connect(this.gatewayAsEOA).receiveMessage(id, this.chain.toErc7930(this.bridgeB), payload),
      ).to.emit(this.bridgeA, 'CrossChainTransferReceived');

      // second time fails
      await expect(
        this.bridgeA.connect(this.gatewayAsEOA).receiveMessage(id, this.chain.toErc7930(this.bridgeB), payload),
      )
        .to.be.revertedWithCustomError(this.bridgeA, 'MessageAlreadyProcessed')
        .withArgs(this.gateway, id);
    });
  });

  describe('reconfiguration', function () {
    it('updating a link emits an event', async function () {
      const newGateway = await ethers.deployContract('$ERC7786GatewayMock');
      const newRemote = this.chain.toErc7930(this.accounts[0]);

      await expect(this.bridgeA.$_setLink(newGateway, newRemote, true))
        .to.emit(this.bridgeA, 'RemoteRegistered')
        .withArgs(newGateway, newRemote);

      await expect(this.bridgeA.link(this.chain.erc7930)).to.eventually.deep.equal([newGateway.target, newRemote]);
    });

    it('cannot override configuration is "allowOverride" is false', async function () {
      const newGateway = await ethers.deployContract('$ERC7786GatewayMock');
      const newRemote = this.chain.toErc7930(this.accounts[0]);

      await expect(this.bridgeA.$_setLink(newGateway, newRemote, false))
        .to.be.revertedWithCustomError(this.bridgeA, 'RemoteAlreadyRegistered')
        .withArgs(this.chain.erc7930);
    });

    it('reject invalid gateway', async function () {
      const notAGateway = this.accounts[0];
      const newRemote = this.chain.toErc7930(this.accounts[0]);

      await expect(this.bridgeA.$_setLink(notAGateway, newRemote, false)).to.be.revertedWithoutReason();
    });
  });
}

module.exports = {
  shouldBehaveLikeBridgeERC20,
};
