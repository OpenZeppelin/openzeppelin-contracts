const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { generators } = require('../helpers/random');

async function fixture() {
  const mock = await ethers.deployContract('$RLP');

  // Resolve function overload ambiguities like in Math.test.js
  mock.$encode_bool = mock['$encode(bool)'];
  mock.$encode_address = mock['$encode(address)'];
  mock.$encode_uint256 = mock['$encode(uint256)'];
  mock.$encode_bytes32 = mock['$encode(bytes32)'];
  mock.$encode_bytes = mock['$encode(bytes)'];
  mock.$encode_string = mock['$encode(string)'];
  mock.$encode_list = mock['$encode(bytes[])'];
  mock.$decodeBytes_item = mock['$decodeBytes((uint256,bytes32))'];
  mock.$decodeBytes_bytes = mock['$decodeBytes(bytes)'];
  mock.$decodeList_item = mock['$decodeList((uint256,bytes32))'];
  mock.$decodeList_bytes = mock['$decodeList(bytes)'];

  return { mock };
}

describe('RLP', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('encoding', function () {
    it('encodes booleans', async function () {
      await expect(this.mock.$encode_bool(false)).to.eventually.equal('0x80'); // 0
      await expect(this.mock.$encode_bool(true)).to.eventually.equal('0x01'); // 1
    });

    it('encodes addresses', async function () {
      const addr = generators.address();
      await expect(this.mock.$encode_address(addr)).to.eventually.equal(ethers.encodeRlp(addr));
    });

    it('encodes uint256', async function () {
      for (const input of [0, 1, 127, 128, 256, 1024, 0xffffff, ethers.MaxUint256]) {
        await expect(this.mock.$encode_uint256(input)).to.eventually.equal(ethers.encodeRlp(ethers.toBeArray(input)));
      }
    });

    it('encodes bytes32', async function () {
      await expect(
        this.mock.$encode_bytes32('0x0000000000000000000000000000000000000000000000000000000000000000'),
      ).to.eventually.equal('0x80');
      await expect(
        this.mock.$encode_bytes32('0x0000000000000000000000000000000000000000000000000000000000000001'),
      ).to.eventually.equal('0x01');
      await expect(
        this.mock.$encode_bytes32('0x1000000000000000000000000000000000000000000000000000000000000000'),
      ).to.eventually.equal('0xa01000000000000000000000000000000000000000000000000000000000000000');
    });

    it('encodes empty byte', async function () {
      const input = '0x';
      await expect(this.mock.$encode_bytes(input)).to.eventually.equal(ethers.encodeRlp(input));
    });

    it('encodes single byte < 128', async function () {
      for (const input of ['0x00', '0x01', '0x7f']) {
        await expect(this.mock.$encode_bytes(input)).to.eventually.equal(ethers.encodeRlp(input));
      }
    });

    it('encodes single byte >= 128', async function () {
      for (const input of ['0x80', '0xff']) {
        await expect(this.mock.$encode_bytes(input)).to.eventually.equal(ethers.encodeRlp(input));
      }
    });

    it('encodes short buffers (1-55 bytes)', async function () {
      for (const input of [
        '0xab', // 1 byte
        '0x1234', // 2 bytes
        generators.bytes(55), // 55 bytes (maximum for short encoding)
      ]) {
        await expect(this.mock.$encode_bytes(input)).to.eventually.equal(ethers.encodeRlp(input));
      }
    });

    it('encodes long buffers (>55 bytes)', async function () {
      for (const input of [
        generators.bytes(56), // 56 bytes (minimum for long encoding)
        generators.bytes(128), // 128 bytes
      ]) {
        await expect(this.mock.$encode_bytes(input)).to.eventually.equal(ethers.encodeRlp(input));
      }
    });

    it('encodes strings', async function () {
      for (const input of [
        '', // empty string
        'dog',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
      ]) {
        await expect(this.mock.$encode_string(input)).to.eventually.equal(ethers.encodeRlp(ethers.toUtf8Bytes(input)));
      }
    });

    it('encode(bytes[])', async function () {
      for (const input of [
        [],
        ['0x'],
        ['0x00'],
        ['0x17', '0x42'],
        ['0x17', '0x', '0x42', '0x0123456789abcdef', '0x'],
      ]) {
        await expect(this.mock.$encode_list(input.map(ethers.encodeRlp))).to.eventually.equal(ethers.encodeRlp(input));
      }
    });

    // const invalidTests = [
    //   { name: 'short string with invalid length', input: '0x8100' },
    //   { name: 'long string with invalid length prefix', input: '0xb800' },
    //   { name: 'list with invalid length', input: '0xc100' },
    //   { name: 'truncated long string', input: '0xb838' },
    //   { name: 'invalid single byte encoding (non-minimal)', input: '0x8100' },
    // ];

    // invalidTests.forEach(({ name, input }) => {
    //   it(`encodes ${name} into invalid RLP`, async function () {
    //     const item = await this.mock.$toItem(input);
    //     await expect(this.mock.$decodeBytes_bytes(item)).to.be.reverted;
    //   });
    // });
  });
});
