import { network } from 'hardhat';
import { expect } from 'chai';
import { ERC7786Bridge } from '../helpers/erc7786';
import * as random from '../helpers/random';

const chainA = await network.create({ override: { chainId: 17 } });
const chainB = await network.create({ override: { chainId: 42 } });
const bridge = await ERC7786Bridge.create(chainA, chainB);

const value = 42n;
const payload = random.bytes(128);
const attributes = [];

async function fixture() {
  const [sender] = await chainA.ethers.getSigners();
  const [notAGateway] = await chainB.ethers.getSigners();

  // the receiver is on chain B, and only trusts the gateway deployed there
  const receiver = await chainB.ethers.deployContract('$ERC7786RecipientMock', [bridge.gateway(chainB)]);

  return { sender, notAGateway, receiver };
}

// NOTE: here we are only testing the receiver. Failures of the gateway itself (invalid attributes, ...) are out of scope.
describe('ERC7786Recipient', function () {
  beforeEach(async function () {
    Object.assign(this, await bridge.loadFixture(fixture));
  });

  it('receives gateway relayed messages', async function () {
    await expect(
      bridge
        .gateway(chainA)
        .connect(this.sender)
        .sendMessage(chainB.helpers.chain.toErc7930(this.receiver), payload, attributes, { value }),
    )
      .to.emit(bridge.gateway(chainA), 'MessageSent')
      .withArgs(
        chainA.ethers.ZeroHash,
        chainA.helpers.chain.toErc7930(this.sender),
        chainB.helpers.chain.toErc7930(this.receiver),
        payload,
        value,
        attributes,
      );

    await expect(bridge.relay().then(([tx]) => tx))
      .to.emit(this.receiver, 'MessageReceived')
      .withArgs(
        bridge.gateway(chainB),
        chainB.ethers.toBeHex(1n, 32n),
        chainA.helpers.chain.toErc7930(this.sender),
        payload,
        value,
      );
  });

  it('receive multiple similar messages', async function () {
    for (let i = 1n; i < 5n; ++i) {
      await bridge
        .gateway(chainA)
        .connect(this.sender)
        .sendMessage(chainB.helpers.chain.toErc7930(this.receiver), payload, attributes, { value });

      await expect(bridge.relay().then(([tx]) => tx))
        .to.emit(this.receiver, 'MessageReceived')
        .withArgs(
          bridge.gateway(chainB),
          chainB.ethers.toBeHex(i, 32n),
          chainA.helpers.chain.toErc7930(this.sender),
          payload,
          value,
        );
    }
  });

  it('unauthorized call', async function () {
    await expect(
      this.receiver
        .connect(this.notAGateway)
        .receiveMessage(chainB.ethers.ZeroHash, chainA.helpers.chain.toErc7930(this.sender), payload),
    )
      .to.be.revertedWithCustomError(this.receiver, 'ERC7786RecipientUnauthorizedGateway')
      .withArgs(this.notAGateway, chainA.helpers.chain.toErc7930(this.sender));
  });
});
