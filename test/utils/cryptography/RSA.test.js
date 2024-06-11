const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const parse = require('./RSA.helper');

async function fixture() {
  return { mock: await ethers.deployContract('$RSA') };
}

describe('RSA', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  // Load test cases from file SigVer15_186-3.rsp from:
  // https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/dss/186-2rsatestvectors.zip
  describe('SigVer15_186-3.rsp tests', function () {
    for (const test of parse('SigVer15_186-3.rsp')) {
      const { length } = Buffer.from(test.S, 'hex');

      /// For now, RSA only supports digest that are 32bytes long. If we ever extend that, we can use these hashing functions for @noble:
      // const { sha1 } = require('@noble/hashes/sha1');
      // const { sha224, sha256 } = require('@noble/hashes/sha256');
      // const { sha384, sha512 } = require('@noble/hashes/sha512');

      if (test.SHAAlg === 'SHA256') {
        const result = test.Result === 'P';

        it(`signature length ${length} ${test.extra} ${result ? 'works' : 'fails'}`, async function () {
          const data = '0x' + test.Msg;
          const sig = '0x' + test.S;
          const exp = '0x' + test.e;
          const mod = '0x' + test.n;

          expect(await this.mock.$pkcs1(ethers.sha256(data), sig, exp, mod)).to.equal(result);
          expect(await this.mock.$pkcs1Sha256(data, sig, exp, mod)).to.equal(result);
        });
      }
    }
  });

  describe('others tests', function () {
    it('openssl', async function () {
      const data = ethers.toUtf8Bytes('hello world');
      const sig =
        '0x079bed733b48d69bdb03076cb17d9809072a5a765460bc72072d687dba492afe951d75b814f561f253ee5cc0f3d703b6eab5b5df635b03a5437c0a5c179309812f5b5c97650361c645bc99f806054de21eb187bc0a704ed38d3d4c2871a117c19b6da7e9a3d808481c46b22652d15b899ad3792da5419e50ee38759560002388';
      const exp =
        '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001';
      const mod =
        '0xdf3edde009b96bc5b03b48bd73fe70a3ad20eaf624d0dc1ba121a45cc739893741b7cf82acf1c91573ec8266538997c6699760148de57e54983191eca0176f518e547b85fe0bb7d9e150df19eee734cf5338219c7f8f7b13b39f5384179f62c135e544cb70be7505751f34568e06981095aeec4f3a887639718a3e11d48c240d';
      expect(await this.mock.$pkcs1Sha256(data, sig, exp, mod)).to.be.true;
    });

    // According to RFC4055, pg.5 and RFC8017, pg. 64, for SHA-1, and the SHA-2 family,
    // the algorithm parameter has to be NULL and both explicit NULL parameter and implicit
    // NULL parameter (ie, absent NULL parameter) are considered to be legal and equivalent.
    it('rfc8017 implicit null parameter', async function () {
      const data = ethers.toUtf8Bytes('hello world!');
      const sig =
        '0xa0073057133ff3758e7e111b4d7441f1d8cbe4b2dd5ee4316a14264290dee5ed7f175716639bd9bb43a14e4f9fcb9e84dedd35e2205caac04828b2c053f68176d971ea88534dd2eeec903043c3469fc69c206b2a8694fd262488441ed8852280c3d4994e9d42bd1d575c7024095f1a20665925c2175e089c0d731471f6cc145404edf5559fd2276e45e448086f71c78d0cc6628fad394a34e51e8c10bc39bfe09ed2f5f742cc68bee899d0a41e4c75b7b80afd1c321d89ccd9fe8197c44624d91cc935dfa48de3c201099b5b417be748aef29248527e8bbb173cab76b48478d4177b338fe1f1244e64d7d23f07add560d5ad50b68d6649a49d7bc3db686daaa7';
      const exp = '0x03';
      const mod =
        '0xe932ac92252f585b3a80a4dd76a897c8b7652952fe788f6ec8dd640587a1ee5647670a8ad4c2be0f9fa6e49c605adf77b5174230af7bd50e5d6d6d6d28ccf0a886a514cc72e51d209cc772a52ef419f6a953f3135929588ebe9b351fca61ced78f346fe00dbb6306e5c2a4c6dfc3779af85ab417371cf34d8387b9b30ae46d7a5ff5a655b8d8455f1b94ae736989d60a6f2fd5cadbffbd504c5a756a2e6bb5cecc13bca7503f6df8b52ace5c410997e98809db4dc30d943de4e812a47553dce54844a78e36401d13f77dc650619fed88d8b3926e3d8e319c80c744779ac5d6abe252896950917476ece5e8fc27d5f053d6018d91b502c4787558a002b9283da7';
      expect(await this.mock.$pkcs1Sha256(data, sig, exp, mod)).to.be.true;
    });

    it('returns false for a very short n', async function () {
      const data = ethers.toUtf8Bytes('hello world!');
      const sig = '0x0102';
      const exp = '0x03';
      const mod = '0x0405';
      expect(await this.mock.$pkcs1Sha256(data, sig, exp, mod)).to.be.false;
    });

    it('returns false for a signature with different length to n', async function () {
      const data = ethers.toUtf8Bytes('hello world!');
      const sig = '0x00112233';
      const exp = '0x03';
      const mod =
        '0xe932ac92252f585b3a80a4dd76a897c8b7652952fe788f6ec8dd640587a1ee5647670a8ad4c2be0f9fa6e49c605adf77b5174230af7bd50e5d6d6d6d28ccf0a886a514cc72e51d209cc772a52ef419f6a953f3135929588ebe9b351fca61ced78f346fe00dbb6306e5c2a4c6dfc3779af85ab417371cf34d8387b9b30ae46d7a5ff5a655b8d8455f1b94ae736989d60a6f2fd5cadbffbd504c5a756a2e6bb5cecc13bca7503f6df8b52ace5c410997e98809db4dc30d943de4e812a47553dce54844a78e36401d13f77dc650619fed88d8b3926e3d8e319c80c744779ac5d6abe252896950917476ece5e8fc27d5f053d6018d91b502c4787558a002b9283da7';
      expect(await this.mock.$pkcs1Sha256(data, sig, exp, mod)).to.be.false;
    });

    it('returns false if s >= n', async function () {
      // this is the openssl example where sig has been replaced by sig + mod
      const data = ethers.toUtf8Bytes('hello world');
      const sig =
        '0xe6dacb53450242618b3e502a257c08acb44b456c7931988da84f0cda8182b435d6d5453ac1e72b07c7dadf2747609b7d544d15f3f14081f9dbad9c48b7aa78d2bdafd81d630f19a0270d7911f4ec82b171e9a95889ffc9e740dc9fac89407a82d152ecb514967d4d9165e67ce0d7f39a3082657cdfca148a5fc2b3a7348c4795';
      const exp =
        '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001';
      const mod =
        '0xdf3edde009b96bc5b03b48bd73fe70a3ad20eaf624d0dc1ba121a45cc739893741b7cf82acf1c91573ec8266538997c6699760148de57e54983191eca0176f518e547b85fe0bb7d9e150df19eee734cf5338219c7f8f7b13b39f5384179f62c135e544cb70be7505751f34568e06981095aeec4f3a887639718a3e11d48c240d';
      expect(await this.mock.$pkcs1Sha256(data, sig, exp, mod)).to.be.false;
    });
  });
});
