import { network } from 'hardhat';
import { expect } from 'chai';
import { generators } from '../helpers/random';

const {
  ethers,
  helpers,
  networkHelpers: { loadFixture },
} = await network.connect();

const value = 42n;
const payload = generators.hexBytes(128);
const attributes = [];

async function fixture() {
  const [sender, notAGateway] = await ethers.getSigners();

  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const receiver = await ethers.deployContract('$ERC7786RecipientMock', [gateway]);

  return { sender, notAGateway, gateway, receiver };
}

// NOTE: here we are only testing the receiver. Failures of the gateway itself (invalid attributes, ...) are out of scope.
describe('ERC7786Recipient', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('receives gateway relayed messages', async function () {
    await expect(
      this.gateway
        .connect(this.sender)
        .sendMessage(helpers.chain.toErc7930(this.receiver), payload, attributes, { value }),
    )
      .to.emit(this.gateway, 'MessageSent')
      .withArgs(
        ethers.ZeroHash,
        helpers.chain.toErc7930(this.sender),
        helpers.chain.toErc7930(this.receiver),
        payload,
        value,
        attributes,
      )
      .to.emit(this.receiver, 'MessageReceived')
      .withArgs(this.gateway, ethers.toBeHex(1n, 32n), helpers.chain.toErc7930(this.sender), payload, value);
  });

  it('receive multiple similar messages (with different receiveIds)', async function () {
    for (let i = 1n; i < 5n; ++i) {
      await expect(
        this.gateway
          .connect(this.sender)
          .sendMessage(helpers.chain.toErc7930(this.receiver), payload, attributes, { value }),
      )
        .to.emit(this.receiver, 'MessageReceived')
        .withArgs(this.gateway, ethers.toBeHex(i, 32n), helpers.chain.toErc7930(this.sender), payload, value);
    }
  });

  it('multiple use of the same receiveId', async function () {
    const gatewayAsEOA = await helpers.impersonate(this.gateway.target);
    const receiveId = ethers.toBeHex(1n, 32n);

    await expect(
      this.receiver
        .connect(gatewayAsEOA)
        .receiveMessage(receiveId, helpers.chain.toErc7930(this.sender), payload, { value }),
    )
      .to.emit(this.receiver, 'MessageReceived')
      .withArgs(this.gateway, receiveId, helpers.chain.toErc7930(this.sender), payload, value);

    await expect(
      this.receiver
        .connect(gatewayAsEOA)
        .receiveMessage(receiveId, helpers.chain.toErc7930(this.sender), payload, { value }),
    )
      .to.be.revertedWithCustomError(this.receiver, 'ERC7786RecipientMessageAlreadyProcessed')
      .withArgs(this.gateway, receiveId);
  });

  it('unauthorized call', async function () {
    await expect(
      this.receiver
        .connect(this.notAGateway)
        .receiveMessage(ethers.ZeroHash, helpers.chain.toErc7930(this.sender), payload),
    )
      .to.be.revertedWithCustomError(this.receiver, 'ERC7786RecipientUnauthorizedGateway')
      .withArgs(this.notAGateway, helpers.chain.toErc7930(this.sender));
  });
});
