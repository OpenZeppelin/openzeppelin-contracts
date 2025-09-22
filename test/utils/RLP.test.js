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

  return { mock };
}

describe('RLP', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('encode/decode booleans', async function () {
    await expect(this.mock.$encode_bool(false)).to.eventually.equal('0x80'); // 0
    await expect(this.mock.$encode_bool(true)).to.eventually.equal('0x01'); // 1

    await expect(this.mock.$decodeBool('0x80')).to.eventually.equal(false); // 0
    await expect(this.mock.$decodeBool('0x01')).to.eventually.equal(true); // 1
  });

  it('encode/decode addresses', async function () {
    const addr = generators.address();
    const expected = ethers.encodeRlp(addr);

    await expect(this.mock.$encode_address(addr)).to.eventually.equal(expected);
    await expect(this.mock.$decodeAddress(expected)).to.eventually.equal(addr);
  });

  it('encode/decode uint256', async function () {
    for (const input of [0, 1, 127, 128, 256, 1024, 0xffffff, ethers.MaxUint256]) {
      const expected = ethers.encodeRlp(ethers.toBeArray(input));

      await expect(this.mock.$encode_uint256(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeUint256(expected)).to.eventually.equal(input);
    }
  });

  it('encode/decode bytes32', async function () {
    for (const { input, expected } of [
      { input: '0x0000000000000000000000000000000000000000000000000000000000000000', expected: '0x80' },
      { input: '0x0000000000000000000000000000000000000000000000000000000000000001', expected: '0x01' },
      {
        input: '0x1000000000000000000000000000000000000000000000000000000000000000',
        expected: '0xa01000000000000000000000000000000000000000000000000000000000000000',
      },
    ]) {
      await expect(this.mock.$encode_bytes32(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeBytes32(expected)).to.eventually.equal(input);
    }
  });

  it('encode/decode empty byte', async function () {
    const input = '0x';
    const expected = ethers.encodeRlp(input);

    await expect(this.mock.$encode_bytes(input)).to.eventually.equal(expected);
    await expect(this.mock.$decodeBytes(expected)).to.eventually.equal(input);
  });

  it('encode/decode single byte < 128', async function () {
    for (const input of ['0x00', '0x01', '0x7f']) {
      const expected = ethers.encodeRlp(input);

      await expect(this.mock.$encode_bytes(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeBytes(expected)).to.eventually.equal(input);
    }
  });

  it('encode/decode single byte >= 128', async function () {
    for (const input of ['0x80', '0xff']) {
      const expected = ethers.encodeRlp(input);

      await expect(this.mock.$encode_bytes(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeBytes(expected)).to.eventually.equal(input);
    }
  });

  it('encode/decode short buffers (1-55 bytes)', async function () {
    for (const input of [
      '0xab', // 1 byte
      '0x1234', // 2 bytes
      generators.bytes(55), // 55 bytes (maximum for short encoding)
    ]) {
      const expected = ethers.encodeRlp(input);

      await expect(this.mock.$encode_bytes(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeBytes(expected)).to.eventually.equal(input);
    }
  });

  it('encode/decode long buffers (>55 bytes)', async function () {
    for (const input of [
      generators.bytes(56), // 56 bytes (minimum for long encoding)
      generators.bytes(128), // 128 bytes
    ]) {
      const expected = ethers.encodeRlp(input);

      await expect(this.mock.$encode_bytes(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeBytes(expected)).to.eventually.equal(input);
    }
  });

  it('encode/decode strings', async function () {
    for (const input of [
      '', // empty string
      'dog',
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
    ]) {
      const expected = ethers.encodeRlp(ethers.toUtf8Bytes(input));

      await expect(this.mock.$encode_string(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeString(expected)).to.eventually.equal(input);
    }
  });

  it('encodes array (bytes[])', async function () {
    for (const input of [[], ['0x'], ['0x00'], ['0x17', '0x42'], ['0x17', '0x', '0x42', '0x0123456789abcdef', '0x']]) {
      await expect(this.mock.$encode_list(input.map(ethers.encodeRlp))).to.eventually.equal(ethers.encodeRlp(input));
    }
  });

  const invalidTests = [
    { name: 'short string with invalid length', input: '0x8100' },
    { name: 'long string with invalid length prefix', input: '0xb800' },
    { name: 'list with invalid length', input: '0xc100' },
    { name: 'truncated long string', input: '0xb838' },
    { name: 'invalid single byte encoding (non-minimal)', input: '0x8100' },
  ];

  invalidTests.forEach(({ name, input }) => {
    it(`rejects ${name}`, async function () {
      await expect(this.mock.$decodeBytes(input)).to.be.revertedWithCustomError(this.mock, 'RLPInvalidEncoding');
    });
  });
});
