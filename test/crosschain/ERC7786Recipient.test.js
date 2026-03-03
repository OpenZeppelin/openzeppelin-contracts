const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getLocalChain } = require('../helpers/chains');
const { generators } = require('../helpers/random');

const value = 42n;
const payload = generators.hexBytes(128);
const attributes = [];

async function fixture() {
  const [sender, notAGateway] = await ethers.getSigners();
  const { toErc7930 } = await getLocalChain();

  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const receiver = await ethers.deployContract('$ERC7786RecipientMock', [gateway]);

  return { sender, notAGateway, gateway, receiver, toErc7930 };
}

// NOTE: here we are only testing the receiver. Failures of the gateway itself (invalid attributes, ...) are out of scope.
describe('ERC7786Recipient', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('receives gateway relayed messages', async function () {
    await expect(
      this.gateway.connect(this.sender).sendMessage(this.toErc7930(this.receiver), payload, attributes, { value }),
    )
      .to.emit(this.gateway, 'MessageSent')
      .withArgs(ethers.ZeroHash, this.toErc7930(this.sender), this.toErc7930(this.receiver), payload, value, attributes)
      .to.emit(this.receiver, 'MessageReceived')
      .withArgs(this.gateway, ethers.toBeHex(1n, 32n), this.toErc7930(this.sender), payload, value);
  });

  it('receive multiple similar messages', async function () {
    for (let i = 1n; i < 5n; ++i) {
      await expect(
        this.gateway.connect(this.sender).sendMessage(this.toErc7930(this.receiver), payload, attributes, { value }),
      )
        .to.emit(this.receiver, 'MessageReceived')
        .withArgs(this.gateway, ethers.toBeHex(i, 32n), this.toErc7930(this.sender), payload, value);
    }
  });

  it('unauthorized call', async function () {
    await expect(
      this.receiver.connect(this.notAGateway).receiveMessage(ethers.ZeroHash, this.toErc7930(this.sender), payload),
    )
      .to.be.revertedWithCustomError(this.receiver, 'ERC7786RecipientUnauthorizedGateway')
      .withArgs(this.notAGateway, this.toErc7930(this.sender));
  });
});
