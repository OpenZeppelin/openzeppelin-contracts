const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { erc1967slot, erc7201slot } = require('../helpers/storage');
const { generators } = require('../helpers/random');

async function fixture() {
  const [account] = await ethers.getSigners();
  const mock = await ethers.deployContract('$SlotDerivation');
  return { mock, account };
}

describe('SlotDerivation', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('namespaces', function () {
    const namespace = 'example.main';

    it('erc-1967', async function () {
      expect(await this.mock.$erc1967slot(namespace)).to.equal(erc1967slot(namespace));
    });

    it('erc-7201', async function () {
      expect(await this.mock.$erc7201slot(namespace)).to.equal(erc7201slot(namespace));
    });
  });

  describe('derivation', function () {
    it('offset', async function () {
      const base = generators.bytes32();
      const offset = generators.uint256();
      expect(await this.mock.$offset(base, offset)).to.equal((ethers.toBigInt(base) + offset) % 2n ** 256n);
    });

    it('array', async function () {
      const base = generators.bytes32();
      expect(await this.mock.$deriveArray(base)).to.equal(ethers.keccak256(base));
    });

    describe('mapping', function () {
      for (const { type, key, isValueType } of [
        { type: 'bool', key: true, isValueType: true },
        { type: 'address', key: generators.address(), isValueType: true },
        { type: 'bytes32', key: generators.bytes32(), isValueType: true },
        { type: 'uint256', key: generators.uint256(), isValueType: true },
        { type: 'int256', key: generators.int256(), isValueType: true },
        { type: 'bytes', key: generators.hexBytes(128), isValueType: false },
        { type: 'string', key: 'lorem ipsum', isValueType: false },
      ]) {
        it(type, async function () {
          const base = generators.bytes32();
          const expected = isValueType
            ? ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode([type, 'bytes32'], [key, base]))
            : ethers.solidityPackedKeccak256([type, 'bytes32'], [key, base]);
          expect(await this.mock[`$deriveMapping(bytes32,${type})`](base, key)).to.equal(expected);
        });
      }
    });
  });
});
