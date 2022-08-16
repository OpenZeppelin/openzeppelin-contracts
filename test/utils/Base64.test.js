const { expect } = require('chai');

const Base64Mock = artifacts.require('Base64Mock');

contract('Strings', function () {
  beforeEach(async function () {
    this.base64 = await Base64Mock.new();
  });

  describe('from bytes - base64', function () {
    it('converts to base64 encoded string with double padding', async function () {
      const TEST_MESSAGE = 'test';
      const input = web3.utils.asciiToHex(TEST_MESSAGE);
      expect(await this.base64.encode(input)).to.equal('dGVzdA==');
    });

    it('converts to base64 encoded string with single padding', async function () {
      const TEST_MESSAGE = 'test1';
      const input = web3.utils.asciiToHex(TEST_MESSAGE);
      expect(await this.base64.encode(input)).to.equal('dGVzdDE=');
    });

    it('converts to base64 encoded string without padding', async function () {
      const TEST_MESSAGE = 'test12';
      const input = web3.utils.asciiToHex(TEST_MESSAGE);
      expect(await this.base64.encode(input)).to.equal('dGVzdDEy');
    });

    it('empty bytes', async function () {
      expect(await this.base64.encode([])).to.equal('');
    });
  });
});
