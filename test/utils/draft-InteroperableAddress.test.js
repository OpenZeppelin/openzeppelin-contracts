const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { addressCoder, nameCoder } = require('interoperable-addresses');
const { CAIP350, chainTypeCoder } = require('interoperable-addresses/dist/CAIP350');

const { getLocalChain } = require('../helpers/chains');

async function fixture() {
  const mock = await ethers.deployContract('$InteroperableAddress');
  return { mock };
}

describe('ERC7390', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('formatEvmV1 address on the local chain', async function () {
    const { reference: chainid, toErc7930 } = await getLocalChain();
    await expect(
      this.mock.$formatEvmV1(ethers.Typed.uint256(chainid), ethers.Typed.address(this.mock)),
    ).to.eventually.equal(toErc7930(this.mock));
  });

  it('formatV1 fails if both reference and address are empty', async function () {
    await expect(this.mock.$formatV1('0x0000', '0x', '0x')).to.be.revertedWithCustomError(
      this.mock,
      'InteroperableAddressEmptyReferenceAndAddress',
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
      {
        title: 'Example 6: Ethereum mainnet, no address',
        name: '@eip155:1#F54D4FBF',
      },
    ]) {
      const { chainType, reference, address } = nameCoder.decode(name, true);
      const binary = addressCoder.encode({ chainType, reference, address });

      it(title, async function () {
        const expected = [
          chainTypeCoder.decode(chainType),
          CAIP350[chainType].reference.decode(reference),
          CAIP350[chainType].address.decode(address),
        ].map(ethers.hexlify);

        await expect(this.mock.$parseV1(binary)).to.eventually.deep.equal(expected);
        await expect(this.mock.$parseV1Calldata(binary)).to.eventually.deep.equal(expected);
        await expect(this.mock.$tryParseV1(binary)).to.eventually.deep.equal([true, ...expected]);
        await expect(this.mock.$tryParseV1Calldata(binary)).to.eventually.deep.equal([true, ...expected]);
        await expect(this.mock.$formatV1(...expected)).to.eventually.equal(binary);

        if (chainType == 'eip155') {
          await expect(this.mock.$parseEvmV1(binary)).to.eventually.deep.equal([
            reference ?? 0n,
            address ?? ethers.ZeroAddress,
          ]);
          await expect(this.mock.$parseEvmV1Calldata(binary)).to.eventually.deep.equal([
            reference ?? 0n,
            address ?? ethers.ZeroAddress,
          ]);
          await expect(this.mock.$tryParseEvmV1(binary)).to.eventually.deep.equal([
            true,
            reference ?? 0n,
            address ?? ethers.ZeroAddress,
          ]);
          await expect(this.mock.$tryParseEvmV1Calldata(binary)).to.eventually.deep.equal([
            true,
            reference ?? 0n,
            address ?? ethers.ZeroAddress,
          ]);

          if (!address) {
            await expect(this.mock.$formatEvmV1(ethers.Typed.uint256(reference))).to.eventually.equal(
              binary.toLowerCase(),
            );
          } else if (!reference) {
            await expect(this.mock.$formatEvmV1(ethers.Typed.address(address))).to.eventually.equal(
              binary.toLowerCase(),
            );
          } else {
            await expect(
              this.mock.$formatEvmV1(ethers.Typed.uint256(reference), ethers.Typed.address(address)),
            ).to.eventually.equal(binary.toLowerCase());
          }
        }
      });
    }
  });

  describe('invalid format', function () {
    for (const [title, binary] of Object.entries({
      // version 2 + some data
      'unsupported version': '0x00020000010100',
      // version + ref: missing chainReferenceLength and addressLength
      'too short (case 1)': '0x00010000',
      // version + ref + chainReference: missing addressLength
      'too short (case 2)': '0x000100000101',
      // version + ref + chainReference + addressLength + part of the address: missing 2 bytes of the address
      'too short (case 3)': '0x00010000010114d8da6bf26964af9d7eed9e03e53415d37aa9',
    })) {
      it(title, async function () {
        await expect(this.mock.$parseV1(binary))
          .to.be.revertedWithCustomError(this.mock, 'InteroperableAddressParsingError')
          .withArgs(binary);
        await expect(this.mock.$parseV1Calldata(binary))
          .to.be.revertedWithCustomError(this.mock, 'InteroperableAddressParsingError')
          .withArgs(binary);
        await expect(this.mock.$parseEvmV1(binary))
          .to.be.revertedWithCustomError(this.mock, 'InteroperableAddressParsingError')
          .withArgs(binary);
        await expect(this.mock.$parseEvmV1Calldata(binary))
          .to.be.revertedWithCustomError(this.mock, 'InteroperableAddressParsingError')
          .withArgs(binary);
        await expect(this.mock.$tryParseV1(binary)).to.eventually.deep.equal([false, '0x0000', '0x', '0x']);
        await expect(this.mock.$tryParseV1Calldata(binary)).to.eventually.deep.equal([false, '0x0000', '0x', '0x']);
        await expect(this.mock.$tryParseEvmV1(binary)).to.eventually.deep.equal([false, 0n, ethers.ZeroAddress]);
        await expect(this.mock.$tryParseEvmV1Calldata(binary)).to.eventually.deep.equal([
          false,
          0n,
          ethers.ZeroAddress,
        ]);
      });
    }

    for (const [title, binary] of Object.entries({
      'not an evm format: chainid too long':
        '0x00010000212dc7f03c13ad47809e88339107c33a612043d704c1c9693a74996e7f9c6bee8f2314d8da6bf26964af9d7eed9e03e53415d37aa96045',
      'not an evm format: address in not 20 bytes': '0x00010000010112d8da6bf26964af9d7eed9e03e53415d37aa9',
    })) {
      it(title, async function () {
        await expect(this.mock.$parseEvmV1(binary))
          .to.be.revertedWithCustomError(this.mock, 'InteroperableAddressParsingError')
          .withArgs(binary);
        await expect(this.mock.$parseEvmV1Calldata(binary))
          .to.be.revertedWithCustomError(this.mock, 'InteroperableAddressParsingError')
          .withArgs(binary);
        await expect(this.mock.$tryParseEvmV1(binary)).to.eventually.deep.equal([false, 0n, ethers.ZeroAddress]);
        await expect(this.mock.$tryParseEvmV1Calldata(binary)).to.eventually.deep.equal([
          false,
          0n,
          ethers.ZeroAddress,
        ]);
      });
    }
  });
});
