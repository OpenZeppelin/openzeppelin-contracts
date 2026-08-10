const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getLocalChain } = require('../helpers/chains');

async function fixture() {
  const chain = await getLocalChain();
  const [other] = await ethers.getSigners();

  const gateway = await ethers.deployContract('$ERC7786GatewayMock');
  const token = await ethers.deployContract('$ERC721', ['Token', 'T']);
  const bridge = await ethers.deployContract('$BridgeERC721', [[], token]);

  return { chain, other, gateway, bridge };
}

describe('CrosschainLinked', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('_setLink', function () {
    it('accepts a canonical counterpart', async function () {
      const counterpart = this.chain.toErc7930(this.other);

      await expect(this.bridge.$_setLink(this.gateway, counterpart, false))
        .to.emit(this.bridge, 'LinkRegistered')
        .withArgs(this.gateway, counterpart);

      await expect(this.bridge.getLink(this.chain.erc7930)).to.eventually.deep.equal([
        this.gateway.target,
        counterpart,
      ]);
    });

    it('rejects a counterpart with trailing bytes (parses but not byte-canonical)', async function () {
      const canonical = this.chain.toErc7930(this.other);
      const nonCanonical = ethers.concat([canonical, '0x1a2b3c4d']);

      await expect(this.bridge.$_setLink(this.gateway, nonCanonical, false))
        .to.be.revertedWithCustomError(this.bridge, 'NonCanonicalCounterpart')
        .withArgs(nonCanonical);
    });
  });
});
