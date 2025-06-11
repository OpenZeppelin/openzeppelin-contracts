const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { CAIP350, asHex, parseERC7913v1, formatERC7913v1, getLocalChain } = require('../helpers/chains');

async function fixture() {
  const mock = await ethers.deployContract('$ERC7930');
  return { mock };
}

describe('ERC7390', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('formatEvmV1 address on the local chain', async function () {
    const { reference: chainid, toErc7930 } = await getLocalChain();
    await expect(this.mock.$formatEvmV1(chainid, this.mock)).to.eventually.equal(toErc7930(this.mock).binary);
  });

  it('formatV1 fails if both reference and address are empty', async function () {
    await expect(this.mock.$formatV1('0x0000', '0x', '0x')).to.be.revertedWithCustomError(
      this.mock,
      'ERC7930EmptyReferenceAndAddress',
    );
  });

  describe('reference examples', function () {
    for (const { title, name } of [
      {
        title: 'Example 1: Ethereum mainnet address',
        name: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#4CA88C9C',
      },
      {
        title: 'Example 2: Solana mainnet address',
        name: 'MJKqp326RZCHnAAbew9MDdui3iCKWco7fsK9sVuZTX2@solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d#88835C11',
      },
      {
        title: 'Example 3: EVM address without chainid',
        name: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155#B26DB7CB',
      },
      {
        title: 'Example 4: Solana mainnet network, no address',
        name: '@solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d#2EB18670',
      },
      {
        title: 'Example 5: Arbitrum One address',
        name: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:42161#D2E02854',
      },
    ]) {
      it(title, async function () {
        const {
          binary,
          fields: { type, reference, address },
        } = formatERC7913v1(parseERC7913v1(name));

        await expect(this.mock.$parseV1(binary)).to.eventually.deep.equal([
          CAIP350[type].chainType,
          asHex(reference),
          asHex(address),
        ]);

        await expect(
          this.mock.$formatV1(CAIP350[type].chainType, asHex(reference), asHex(address)),
        ).to.eventually.equal(binary);

        if (type == 'eip155' && reference && address) {
          await expect(this.mock.$formatEvmV1(reference, address)).to.eventually.equal(binary.toLowerCase());
        }
      });
    }
  });
});
