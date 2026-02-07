const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { MAX_UINT64 } = require('../helpers/constants');
const { product } = require('../helpers/iterate');
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

    // Non-canonical encodings treated as true
    await expect(this.mock.$decodeBool('0x02')).to.eventually.equal(true);
    await expect(this.mock.$decodeBool('0x03')).to.eventually.equal(true);
    await expect(this.mock.$decodeBool('0x7f')).to.eventually.equal(true);
  });

  it('encode/decode addresses', async function () {
    for (const addr of [
      ethers.ZeroAddress, // zero address
      '0x0000F90827F1C53a10cb7A02335B175320002935', // address with leading zeros
      generators.address(), // random address
    ]) {
      const expected = ethers.encodeRlp(addr);
      await expect(this.mock.$encode_address(addr)).to.eventually.equal(expected);
      await expect(this.mock.$decodeAddress(expected)).to.eventually.equal(addr);
    }

    await expect(this.mock.$decodeAddress('0x940000000000000000000000000000000000001234')).to.eventually.equal(
      '0x0000000000000000000000000000000000001234',
    ); // Canonical encoding (address as 20 bytes with prefix)

    // Single-byte encoding for precompile addresses
    await expect(this.mock.$decodeAddress('0x01')).to.eventually.equal('0x0000000000000000000000000000000000000001');
    await expect(this.mock.$decodeAddress('0x940000000000000000000000000000000000000001')).to.eventually.equal(
      '0x0000000000000000000000000000000000000001',
    ); // 21-byte encoding
    await expect(this.mock.$decodeAddress('0x05')).to.eventually.equal('0x0000000000000000000000000000000000000005');
    await expect(this.mock.$decodeAddress('0x940000000000000000000000000000000000000005')).to.eventually.equal(
      '0x0000000000000000000000000000000000000005',
    ); // 21-byte encoding
    await expect(this.mock.$decodeAddress('0x7f')).to.eventually.equal('0x000000000000000000000000000000000000007f');
    await expect(this.mock.$decodeAddress('0x94000000000000000000000000000000000000007f')).to.eventually.equal(
      '0x000000000000000000000000000000000000007f',
    ); // 21-byte encoding
  });

  it('encode/decode uint256', async function () {
    for (const input of [0, 1, 127, 128, 256, 1024, 0xffffff, ethers.MaxUint256]) {
      const expected = ethers.encodeRlp(ethers.toBeArray(input));

      await expect(this.mock.$encode_uint256(input)).to.eventually.equal(expected);
      await expect(this.mock.$decodeUint256(expected)).to.eventually.equal(input);

      await expect(this.mock.$decodeUint256('0x88ab54a98ceb1f0ad2')).to.eventually.equal(12345678901234567890n); // Canonical encoding for 12345678901234567890
      await expect(this.mock.$decodeUint256('0x8900ab54a98ceb1f0ad2')).to.eventually.equal(12345678901234567890n); // Non-canonical encoding with leading zero for the same value

      await expect(this.mock.$decodeUint256('0x80')).to.eventually.equal(0n); // Canonical encoding for 0
      await expect(this.mock.$decodeUint256('0x820000')).to.eventually.equal(0n); // Non-canonical encoding with leading zero
      await expect(this.mock.$decodeUint256('0x83000000')).to.eventually.equal(0n); // Non-canonical encoding with two leading zeros
      await expect(this.mock.$decodeUint256('0x8400000000')).to.eventually.equal(0n); // Non-canonical encoding with three leading zeros

      await expect(this.mock.$decodeUint256('0x8204d2')).to.eventually.equal(1234n); // Canonical
      await expect(this.mock.$decodeUint256('0x830004d2')).to.eventually.equal(1234n); // With leading zero
      await expect(this.mock.$decodeUint256('0x84000004d2')).to.eventually.equal(1234n); // With two leading zeros
    }
  });

  it('encode/decode bytes32', async function () {
    for (const input of [
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      '0x1000000000000000000000000000000000000000000000000000000000000000',
      generators.bytes32(),
    ]) {
      const encoded = ethers.encodeRlp(input);
      await expect(this.mock.$encode_bytes32(input)).to.eventually.equal(encoded);
      await expect(this.mock.$decodeBytes32(encoded)).to.eventually.equal(input);
    }

    // Compact encoding for 1234
    await expect(this.mock.$decodeBytes32('0x8204d2')).to.eventually.equal(
      '0x00000000000000000000000000000000000000000000000000000000000004d2',
    );
    // Encoding with one leading zero
    await expect(this.mock.$decodeBytes32('0x830004d2')).to.eventually.equal(
      '0x00000000000000000000000000000000000000000000000000000000000004d2',
    );
    // Encoding with two leading zeros
    await expect(this.mock.$decodeBytes32('0x84000004d2')).to.eventually.equal(
      '0x00000000000000000000000000000000000000000000000000000000000004d2',
    );
    // Encoding for the value
    await expect(this.mock.$decodeBytes32('0x80')).to.eventually.equal(ethers.ZeroHash);
    // Encoding for two zeros (and nothing else)
    await expect(this.mock.$decodeBytes32('0x820000')).to.eventually.equal(ethers.ZeroHash);
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
      '000000000cat', // string with leading zeros
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

  it('RLP encoder predict create addresses', async function () {
    for (const [from, nonce] of product(
      [
        ethers.ZeroAddress, // zero address
        '0x0000F90827F1C53a10cb7A02335B175320002935', // address with heading zeros
        generators.address(), // random address
      ],
      [0n, 1n, 42n, 65535n, MAX_UINT64],
    )) {
      await expect(
        this.mock
          .$encode_list([this.mock.$encode_address(from), this.mock.$encode_uint256(nonce)])
          .then(encoded => ethers.getAddress(ethers.dataSlice(ethers.keccak256(encoded), 12))), // hash the encoded content, take the last 20 bytes and format as (checksummed) address
      ).to.eventually.equal(ethers.getCreateAddress({ from, nonce }));
    }
  });
});
