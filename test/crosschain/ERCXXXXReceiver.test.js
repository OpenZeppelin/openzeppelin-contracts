const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getLocalCAIP } = require('../helpers/chains');
const payload = require('../helpers/random').generators.hexBytes(128);
const attributes = [];

async function fixture() {
  const [sender, notAGateway] = await ethers.getSigners();
  const { caip2, toCaip10 } = await getLocalCAIP();

  const gateway = await ethers.deployContract('$ERCXXXXGatewayMock');
  const receiver = await ethers.deployContract('$ERCXXXXReceiverMock', [gateway]);

  return { sender, notAGateway, gateway, receiver, caip2, toCaip10 };
}

// NOTE: here we are only testing the receiver. Failures of the gateway itself (invalid attributes, ...) are out of scope.
describe('ERCXXXXReceiver', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('active mode', function () {
    beforeEach(async function () {
      await this.gateway.$_setActive(true);
    });

    it('nominal workflow', async function () {
      await expect(this.gateway.connect(this.sender).sendMessage(this.caip2, this.receiver.target, payload, attributes))
        .to.emit(this.gateway, 'MessageCreated')
        .withArgs(ethers.ZeroHash, this.toCaip10(this.sender), this.toCaip10(this.receiver), payload, attributes)
        .to.emit(this.receiver, 'MessageReceived')
        .withArgs(this.gateway, this.caip2, this.sender.address, payload, attributes);
    });
  });

  describe('passive mode', function () {
    beforeEach(async function () {
      await this.gateway.$_setActive(false);
    });

    it('nominal workflow', async function () {
      await expect(this.gateway.connect(this.sender).sendMessage(this.caip2, this.receiver.target, payload, attributes))
        .to.emit(this.gateway, 'MessageCreated')
        .withArgs(ethers.ZeroHash, this.toCaip10(this.sender), this.toCaip10(this.receiver), payload, attributes)
        .to.not.emit(this.receiver, 'MessageReceived');

      await expect(
        this.receiver.receiveMessage(this.gateway, '0x', this.caip2, this.sender.address, payload, attributes),
      )
        .to.emit(this.receiver, 'MessageReceived')
        .withArgs(this.gateway, this.caip2, this.sender.address, payload, attributes);
    });

    it('invalid message', async function () {
      await this.gateway.connect(this.sender).sendMessage(this.caip2, this.receiver.target, payload, attributes);

      // Altering the message (in this case, changing the sender's address)
      // Here the error is actually triggered by the gateway itself.
      await expect(
        this.receiver.receiveMessage(this.gateway, '0x', this.caip2, this.notAGateway, payload, attributes),
      ).to.be.revertedWith('invalid message');
    });

    it('invalid gateway', async function () {
      await expect(
        this.receiver.receiveMessage(this.notAGateway, '0x', this.caip2, this.sender.address, payload, attributes),
      )
        .to.be.revertedWithCustomError(this.receiver, 'ERCXXXXReceiverInvalidGateway')
        .withArgs(this.notAGateway);
    });
  });
});
