const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$RLP');

  // Resolve function overload ambiguities like in Math.test.js
  mock.$encode_bytes = mock['$encode(bytes)'];
  mock.$encode_list = mock['$encode(bytes[])'];
  mock.$encode_string = mock['$encode(string)'];
  mock.$encode_address = mock['$encode(address)'];
  mock.$encode_uint256 = mock['$encode(uint256)'];
  mock.$encode_bytes32 = mock['$encode(bytes32)'];
  mock.$encode_bool = mock['$encode(bool)'];
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
    it('encodes zero', async function () {
      await expect(this.mock.$encode_uint256(0)).to.eventually.equal('0x80');
    });

    it('encodes single byte < 128', async function () {
      await expect(this.mock.$encode_bytes('0x00')).to.eventually.equal('0x00');
      await expect(this.mock.$encode_bytes('0x01')).to.eventually.equal('0x01');
      await expect(this.mock.$encode_bytes('0x7f')).to.eventually.equal('0x7f');
    });

    it('encodes single byte >= 128', async function () {
      await expect(this.mock.$encode_bytes('0x80')).to.eventually.equal('0x8180');
      await expect(this.mock.$encode_bytes('0xff')).to.eventually.equal('0x81ff');
    });

    it('encodes short strings (0-55 bytes)', async function () {
      // 1 byte
      await expect(this.mock.$encode_bytes('0xab')).to.eventually.equal('0x81ab');

      // 2 bytes
      await expect(this.mock.$encode_bytes('0x1234')).to.eventually.equal('0x821234');

      // 55 bytes (maximum for short encoding)
      const fiftyFiveBytes = '0x' + '00'.repeat(55);
      const expectedShort = '0xb7' + '00'.repeat(55);
      await expect(this.mock.$encode_bytes(fiftyFiveBytes)).to.eventually.equal(expectedShort);
    });

    it('encodes long strings (>55 bytes)', async function () {
      // 56 bytes (minimum for long encoding)
      const fiftySixBytes = '0x' + '00'.repeat(56);
      const expectedLong = '0xb838' + '00'.repeat(56);
      await expect(this.mock.$encode_bytes(fiftySixBytes)).to.eventually.equal(expectedLong);

      // 100 bytes
      const hundredBytes = '0x' + '00'.repeat(100);
      const expectedHundred = '0xb864' + '00'.repeat(100);
      await expect(this.mock.$encode_bytes(hundredBytes)).to.eventually.equal(expectedHundred);
    });

    it('encodes strings', async function () {
      await expect(this.mock.$encode_string('')).to.eventually.equal('0x80');
      await expect(this.mock.$encode_string('dog')).to.eventually.equal('0x83646f67');
      await expect(
        this.mock.$encode_string('Lorem ipsum dolor sit amet, consectetur adipisicing elit'),
      ).to.eventually.equal(
        '0xb8384c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e7365637465747572206164697069736963696e6720656c6974',
      );
    });

    it('encodes addresses', async function () {
      const addr = '0x1234567890123456789012345678901234567890';
      await expect(this.mock.$encode_address(addr)).to.eventually.equal('0x941234567890123456789012345678901234567890');
    });

    it('encodes uint256', async function () {
      await expect(this.mock.$encode_uint256(0)).to.eventually.equal('0x80');
      await expect(this.mock.$encode_uint256(1)).to.eventually.equal('0x01');
      await expect(this.mock.$encode_uint256(127)).to.eventually.equal('0x7f');
      await expect(this.mock.$encode_uint256(128)).to.eventually.equal('0x8180');
      await expect(this.mock.$encode_uint256(256)).to.eventually.equal('0x820100');
      await expect(this.mock.$encode_uint256(1024)).to.eventually.equal('0x820400');
      await expect(this.mock.$encode_uint256(0xffffff)).to.eventually.equal('0x83ffffff');
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

    it('encodes booleans', async function () {
      await expect(this.mock.$encode_bool(false)).to.eventually.equal('0x80'); // 0
      await expect(this.mock.$encode_bool(true)).to.eventually.equal('0x01'); // 1
    });

    it('encodes strict booleans', async function () {
      await expect(this.mock.$encodeStrict(false)).to.eventually.equal('0x80'); // empty
      await expect(this.mock.$encodeStrict(true)).to.eventually.equal('0x01'); // 0x01
    });

    const validTests = [
      // Basic string encoding
      { name: 'empty string', input: '' },
      { name: 'dog', input: 'dog' },
      {
        name: 'Lorem ipsum',
        input: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit',
      },

      // Numeric encoding
      { name: 'small integer 1', input: 1 },
      { name: 'small integer 16', input: 16 },
      { name: 'small integer 79', input: 79 },
      { name: 'small integer 127', input: 127 },
      { name: 'medium integer 128', input: 128 },
      { name: 'medium integer 1000', input: 1000 },
      { name: 'medium integer 100000', input: 100000 },

      // List encoding
      { name: 'empty list', input: [] },
      { name: 'list of strings', input: ['dog', 'god', 'cat'] },
    ];

    validTests.forEach(({ name, input }) => {
      it(`encodes ${name}`, async function () {
        let encoded;
        let expected;

        if (typeof input === 'string') {
          encoded = await this.mock.$encode_string(input);
          expected = ethers.encodeRlp(ethers.toUtf8Bytes(input));
        } else if (typeof input === 'number') {
          encoded = await this.mock.$encode_uint256(input);
          expected = ethers.encodeRlp(ethers.toBeHex(input));
        } else if (Array.isArray(input)) {
          if (input.length === 0) {
            encoded = await this.mock.$encode_list(input);
          } else {
            const encodedItems = input.map(item => ethers.encodeRlp(ethers.toUtf8Bytes(item)));
            encoded = await this.mock.$encode_list(encodedItems);
          }
          expected = ethers.encodeRlp(input.map(item => ethers.toUtf8Bytes(item)));
        }

        expect(encoded).to.equal(expected);
      });
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
