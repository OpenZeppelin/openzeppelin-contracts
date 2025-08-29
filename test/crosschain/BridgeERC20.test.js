const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { impersonate } = require('../helpers/account');
const { getLocalChain } = require('../helpers/chains');

const amount = 100n;

async function fixture() {
  const chain = await getLocalChain();
  const accounts = await ethers.getSigners();

  // Mock gateway
  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const gatewayAsEOA = await impersonate(gateway);

  // Chain A: legacy ERC20 with bridge
  const tokenA = await ethers.deployContract('$ERC20', ['Token1', 'T1']);
  const bridgeA = await ethers.deployContract('$BridgeERC20Custodial', [gateway, [], tokenA]);

  // Chain B: ERC7802 with bridge
  const tokenB = await ethers.deployContract('$ERC20BridgeableMock', ['Token2', 'T2', ethers.ZeroAddress]);
  const bridgeB = await ethers.deployContract('$BridgeERC20Bridgeable', [gateway, [], tokenB]);

  // deployment check + remote setup
  await expect(bridgeA.deploymentTransaction()).to.emit(bridgeA, 'GatewayChange').withArgs(ethers.ZeroAddress, gateway);
  await expect(bridgeB.deploymentTransaction()).to.emit(bridgeB, 'GatewayChange').withArgs(ethers.ZeroAddress, gateway);
  await expect(bridgeA.$_registerRemote(chain.toErc7930(bridgeB), false))
    .to.emit(bridgeA, 'RemoteRegistered')
    .withArgs(chain.toErc7930(bridgeB));
  await expect(bridgeB.$_registerRemote(chain.toErc7930(bridgeA), false))
    .to.emit(bridgeB, 'RemoteRegistered')
    .withArgs(chain.toErc7930(bridgeA));
  await tokenB.$_setBridge(bridgeB);

  // helper
  const encodePayload = (from, to, amount) =>
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'bytes', 'uint256'],
      [chain.toErc7930(from), to.target ?? to.address ?? to, amount],
    );

  return { chain, accounts, gateway, gatewayAsEOA, tokenA, tokenB, bridgeA, bridgeB, encodePayload };
}

describe('CrosschainBridgeERC20', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('initial setup', async function () {
    await expect(this.bridgeA.token()).to.eventually.equal(this.tokenA);
    await expect(this.bridgeA.gateway()).to.eventually.equal(this.gateway);
    await expect(this.bridgeA.remote(this.chain.erc7930)).to.eventually.equal(this.chain.toErc7930(this.bridgeB));
    await expect(this.bridgeB.token()).to.eventually.equal(this.tokenB);
    await expect(this.bridgeB.gateway()).to.eventually.equal(this.gateway);
    await expect(this.bridgeB.remote(this.chain.erc7930)).to.eventually.equal(this.chain.toErc7930(this.bridgeA));
  });

  it('crosschain send', async function () {
    const [alice, bruce, chris] = this.accounts;

    await this.tokenA.$_mint(alice, amount);
    await this.tokenA.connect(alice).approve(this.bridgeA, ethers.MaxUint256);

    await expect(this.tokenA.totalSupply()).to.eventually.equal(amount);
    await expect(this.tokenA.balanceOf(this.bridgeA)).to.eventually.equal(0n);
    await expect(this.tokenB.totalSupply()).to.eventually.equal(0n);

    // Alice sends tokens from chain A to Bruce on chain B.
    await expect(this.bridgeA.connect(alice).crosschainTransfer(this.chain.toErc7930(bruce), amount))
      // bridge on chain A takes custody of the funds
      .to.emit(this.tokenA, 'Transfer')
      .withArgs(alice, this.bridgeA, amount)
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
      .withArgs(ethers.ZeroAddress, bruce, amount);

    await expect(this.tokenA.totalSupply()).to.eventually.equal(amount);
    await expect(this.tokenA.balanceOf(this.bridgeA)).to.eventually.equal(amount);
    await expect(this.tokenB.totalSupply()).to.eventually.equal(amount);
    await expect(this.tokenB.balanceOf(bruce)).to.eventually.equal(amount);

    // Bruce sends tokens from chain B to Chris on chain A.
    await expect(this.bridgeB.connect(bruce).crosschainTransfer(this.chain.toErc7930(chris), amount))
      // tokens are burned on chain B
      .to.emit(this.tokenB, 'Transfer')
      .withArgs(bruce, ethers.ZeroAddress, amount)
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
      .withArgs(this.bridgeA, chris, amount);

    await expect(this.tokenA.totalSupply()).to.eventually.equal(amount);
    await expect(this.tokenA.balanceOf(chris)).to.eventually.equal(amount);
    await expect(this.tokenB.totalSupply()).to.eventually.equal(0n);
  });

  describe('crosschain operations', function () {
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
        .to.be.revertedWithCustomError(this.bridgeA, 'InvalidGateway')
        .withArgs(notGateway);
    });

    it('only remote can send a crosschain message', async function () {
      const [notRemote] = this.accounts;

      await expect(
        this.gateway
          .connect(notRemote)
          .sendMessage(this.chain.toErc7930(this.bridgeA), this.encodePayload(notRemote, notRemote, amount), []),
      )
        .to.be.revertedWithCustomError(this.bridgeA, 'InvalidSender')
        .withArgs(this.chain.toErc7930(notRemote));
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

  describe('administration', function () {
    it('updating the gateway emits an event', async function () {
      const newGateway = await ethers.deployContract('$ERC7786GatewayMock');

      await expect(this.bridgeA.$_setGateway(newGateway))
        .to.emit(this.bridgeA, 'GatewayChange')
        .withArgs(this.gateway, newGateway);

      await expect(this.bridgeA.gateway()).to.eventually.equal(newGateway);
    });

    it('updating a remote emits an event', async function () {
      const newRemote = this.chain.toErc7930(this.accounts[0]);

      await expect(this.bridgeA.$_registerRemote(newRemote, true))
        .to.emit(this.bridgeA, 'RemoteRegistered')
        .withArgs(newRemote);

      await expect(this.bridgeA.remote(this.chain.erc7930)).to.eventually.equal(newRemote);
    });

    it('remote update protection', async function () {
      const newRemote = this.chain.toErc7930(this.accounts[0]);

      await expect(this.bridgeA.$_registerRemote(newRemote, false))
        .to.be.revertedWithCustomError(this.bridgeA, 'RemoteAlreadyRegistered')
        .withArgs(this.chain.toErc7930(this.bridgeB));
    });
  });
});
