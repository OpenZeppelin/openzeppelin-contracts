const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const base64 = await ethers.deployContract('$Base64');
  return { base64 };
}

describe('Strings', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('from bytes - base64', function () {
    it('converts to base64 encoded string with double padding', async function () {
      const TEST_MESSAGE = 'test';
      const input = ethers.toUtf8Bytes(TEST_MESSAGE);
      expect(await this.base64.$encode(input)).to.equal('dGVzdA==');
    });

    it('converts to base64 encoded string with single padding', async function () {
      const TEST_MESSAGE = 'test1';
      const input = ethers.toUtf8Bytes(TEST_MESSAGE);
      expect(await this.base64.$encode(input)).to.equal('dGVzdDE=');
    });

    it('converts to base64 encoded string without padding', async function () {
      const TEST_MESSAGE = 'test12';
      const input = ethers.toUtf8Bytes(TEST_MESSAGE);
      expect(await this.base64.$encode(input)).to.equal('dGVzdDEy');
    });

    it('empty bytes', async function () {
      expect(await this.base64.$encode('0x')).to.equal('');
    });
  });
});
