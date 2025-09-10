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

describe('Base64', function () {
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
        await expect(this.mock.$encode(buffer)).to.eventually.equal(ethers.encodeBase64(buffer));
        await expect(this.mock.$encode(buffer)).to.eventually.equal(expected);
        await expect(this.mock.$decode(expected)).to.eventually.equal(ethers.hexlify(buffer));
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
        await expect(this.mock.$encodeURL(buffer)).to.eventually.equal(base64toBase64Url(ethers.encodeBase64(buffer)));
        await expect(this.mock.$encodeURL(buffer)).to.eventually.equal(expected);
        await expect(this.mock.$decode(expected)).to.eventually.equal(ethers.hexlify(buffer));
      });
  });

  it('Decode invalid base64 string', async function () {
    const getHexCode = str => ethers.hexlify(ethers.toUtf8Bytes(str));
    const helper = { interface: ethers.Interface.from(['error InvalidBase64Digit(bytes1)']) };

    // ord('*') < 43
    await expect(this.mock.$decode('dGVzd*=='))
      .to.be.revertedWithCustomError(helper, 'InvalidBase64Digit')
      .withArgs(getHexCode('*'));
    // ord('{') > 122
    await expect(this.mock.$decode('dGVzd{=='))
      .to.be.revertedWithCustomError(helper, 'InvalidBase64Digit')
      .withArgs(getHexCode('{'));
    // ord('@') in range, but '@' not in the dictionary
    await expect(this.mock.$decode('dGVzd@=='))
      .to.be.revertedWithCustomError(helper, 'InvalidBase64Digit')
      .withArgs(getHexCode('@'));
  });

  it('Encode reads beyond the input buffer into dirty memory', async function () {
    const mock = await ethers.deployContract('Base64Dirty');
    const buffer32 = ethers.id('example');
    const buffer31 = buffer32.slice(0, -2);

    expect(await mock.encode(buffer31)).to.equal(ethers.encodeBase64(buffer31));
    expect(await mock.encode(buffer32)).to.equal(ethers.encodeBase64(buffer32));
  });
});
