const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

// Replace "+/" with "-_" in the char table, and remove the padding
// see https://datatracker.ietf.org/doc/html/rfc4648#section-5
const base64toBase64Url = str => str.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

async function fixture() {
  const mock = await ethers.deployContract('$Base64');
  return { mock };
}

describe('Strings', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('base64', function () {
    for (const { title, input, expected } of [
      { title: 'converts to base64 encoded string with double padding', input: 'test', expected: 'dGVzdA==' },
      { title: 'converts to base64 encoded string with single padding', input: 'test1', expected: 'dGVzdDE=' },
      { title: 'converts to base64 encoded string without padding', input: 'test12', expected: 'dGVzdDEy' },
      { title: 'converts to base64 encoded string (/ case)', input: 'où', expected: 'b/k=' },
      { title: 'converts to base64 encoded string (+ case)', input: 'zs~1t8', expected: 'enN+MXQ4' },
      { title: 'empty bytes', input: '', expected: '' },
    ])
      it(title, async function () {
        const buffer = Buffer.from(input, 'ascii');
        expect(await this.mock.$encode(buffer)).to.equal(ethers.encodeBase64(buffer));
        expect(await this.mock.$encode(buffer)).to.equal(expected);
      });
  });

  describe('base64url', function () {
    for (const { title, input, expected } of [
      { title: 'converts to base64url encoded string with double padding', input: 'test', expected: 'dGVzdA' },
      { title: 'converts to base64url encoded string with single padding', input: 'test1', expected: 'dGVzdDE' },
      { title: 'converts to base64url encoded string without padding', input: 'test12', expected: 'dGVzdDEy' },
      { title: 'converts to base64url encoded string (_ case)', input: 'où', expected: 'b_k' },
      { title: 'converts to base64url encoded string (- case)', input: 'zs~1t8', expected: 'enN-MXQ4' },
      { title: 'empty bytes', input: '', expected: '' },
    ])
      it(title, async function () {
        const buffer = Buffer.from(input, 'ascii');
        expect(await this.mock.$encodeURL(buffer)).to.equal(base64toBase64Url(ethers.encodeBase64(buffer)));
        expect(await this.mock.$encodeURL(buffer)).to.equal(expected);
      });
  });

  it('Encode reads beyond the input buffer into dirty memory', async function () {
    const mock = await ethers.deployContract('Base64Dirty');
    const buffer32 = ethers.id('example');
    const buffer31 = buffer32.slice(0, -2);

    expect(await mock.encode(buffer31)).to.equal(ethers.encodeBase64(buffer31));
    expect(await mock.encode(buffer32)).to.equal(ethers.encodeBase64(buffer32));
  });
});
