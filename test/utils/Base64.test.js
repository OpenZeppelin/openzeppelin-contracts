const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$Base64');
  return { mock };
}

describe('Strings', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('from bytes - base64', function () {
    for (const { title, input, expected } of [
      { title: 'converts to base64 encoded string with double padding', input: 'test', expected: 'dGVzdA==' },
      { title: 'converts to base64 encoded string with single padding', input: 'test1', expected: 'dGVzdDE=' },
      { title: 'converts to base64 encoded string without padding', input: 'test12', expected: 'dGVzdDEy' },
      { title: 'empty bytes', input: '0x', expected: '' },
    ])
      it(title, async function () {
        const raw = ethers.isBytesLike(input) ? input : ethers.toUtf8Bytes(input);

        expect(await this.mock.$encode(raw)).to.equal(ethers.encodeBase64(raw));
        expect(await this.mock.$encode(raw)).to.equal(expected);
      });
  });
});
