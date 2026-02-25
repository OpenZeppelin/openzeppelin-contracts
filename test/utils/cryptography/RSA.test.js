const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { bytes, bytes32 } = ethers.Typed;

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

      if (test.SHAAlg === 'SHA256' && length >= 0x100) {
        const result = test.Result === 'P';

        it(`signature length ${length} ${test.extra} ${result ? 'works' : 'fails'}`, async function () {
          const data = '0x' + test.Msg;
          const sig = '0x' + test.S;
          const exp = ethers.stripZerosLeft('0x' + test.e); // strip zeros to reduce gas cost of the precompile
          const mod = '0x' + test.n;

          expect(await this.mock.$pkcs1Sha256(bytes32(ethers.sha256(data)), sig, exp, mod)).to.equal(result);
          expect(await this.mock.$pkcs1Sha256(bytes(data), sig, exp, mod)).to.equal(result);
        });
      }
    }
  });

  describe('others tests', function () {
    // > openssl genrsa -out private.pem 2048
    // > openssl rsa -in private.pem -outform der -pubout -out public.pem
    // > openssl asn1parse -in public.pem -inform DER -strparse 19
    // > echo -n 'hello world!' | openssl dgst -sha256 -sign private.pem | xxd -p | tr -d \\n
    const openssl = {
      descr: 'openssl',
      data: ethers.toUtf8Bytes('hello world!'),
      sig: '0x2ff4349940bf0db9bce422e316ac47e3d24b0a869acb05c9c46f74e17491177698b150f2a5996a6bf7d7c73e05af91ad78632115a7d95b823c462596486e56e8473b75a270ca4760cd83f244d5d3af81d2c7d188879abbc2992b22d51e22ffb725f0828c852ee44f81def383e0f92ebfa3c6d97ca5e52a4254f9a886680e3fb394c2a8a955849313dce2cb416f8a67974effd9a17d229146ce10a98684fb3d46a1e53ddaf831cdd2beed895532533c554ae087b2738a5c4cf0802e8062b2a599fd76d67b92eabffa8a92b24e08fbc866217502a4a3d9f6157e491bede3c1048fa8f2d804f66128e8a883018b0ec33a59e1086bf71ae5dc193d9815ca82892dbc',
      exp: '0x010001',
      mod: '0xDC1CE5F7B202464CD320B4F9E44FEE0A358BE7022AB155A5BDEE45B1AED3C5A19645D898E294CBA96EAD6929FD8FB4B23E9ADB4D3143A736232C32A8617A77B89F7D8399B9BE37F8349D111067F71D2F20237B9F1A7C1CF44819F9FA5AA030F563DCFB1CC59FFAA86BA2ABEE28D949FED0DF34071B7558950079E28CD9BBA4CAC2F0F86D7BBFB13363C792B5A70C9B279F0B43A264A7CB1A7C7C41FC6EC1D1C1125A6BECE3207AE582F74CE896B9AC18DB00C8985B70145217B831CC313FC06581E186BF70A2EEE2C3C065B5C91A89B2C099B4924CDBF5707D161BD83AC8D9FCA309AC75D63EACF21027C2C9C9F05994331CBDFDD24F9BC6C8B58D8F1824540B',
      result: true,
    };

    // According to RFC4055, pg.5 and RFC8017, pg. 64, for SHA-1, and the SHA-2 family,
    // the algorithm parameter has to be NULL and both explicit NULL parameter and implicit
    // NULL parameter (ie, absent NULL parameter) are considered to be legal and equivalent.
    const rfc4055 = {
      descr: 'rfc8017 implicit null parameter',
      data: ethers.toUtf8Bytes('hello world!'),
      sig: '0xa0073057133ff3758e7e111b4d7441f1d8cbe4b2dd5ee4316a14264290dee5ed7f175716639bd9bb43a14e4f9fcb9e84dedd35e2205caac04828b2c053f68176d971ea88534dd2eeec903043c3469fc69c206b2a8694fd262488441ed8852280c3d4994e9d42bd1d575c7024095f1a20665925c2175e089c0d731471f6cc145404edf5559fd2276e45e448086f71c78d0cc6628fad394a34e51e8c10bc39bfe09ed2f5f742cc68bee899d0a41e4c75b7b80afd1c321d89ccd9fe8197c44624d91cc935dfa48de3c201099b5b417be748aef29248527e8bbb173cab76b48478d4177b338fe1f1244e64d7d23f07add560d5ad50b68d6649a49d7bc3db686daaa7',
      exp: '0x03',
      mod: '0xe932ac92252f585b3a80a4dd76a897c8b7652952fe788f6ec8dd640587a1ee5647670a8ad4c2be0f9fa6e49c605adf77b5174230af7bd50e5d6d6d6d28ccf0a886a514cc72e51d209cc772a52ef419f6a953f3135929588ebe9b351fca61ced78f346fe00dbb6306e5c2a4c6dfc3779af85ab417371cf34d8387b9b30ae46d7a5ff5a655b8d8455f1b94ae736989d60a6f2fd5cadbffbd504c5a756a2e6bb5cecc13bca7503f6df8b52ace5c410997e98809db4dc30d943de4e812a47553dce54844a78e36401d13f77dc650619fed88d8b3926e3d8e319c80c744779ac5d6abe252896950917476ece5e8fc27d5f053d6018d91b502c4787558a002b9283da7',
      result: true,
    };

    const shortN = {
      descr: 'returns false for a very short n',
      data: ethers.toUtf8Bytes('hello world!'),
      sig: '0x0102',
      exp: '0x03',
      mod: '0x0405',
      result: false,
    };

    const differentLength = {
      descr: 'returns false for a signature with different length to n',
      data: ethers.toUtf8Bytes('hello world!'),
      sig: '0x00112233',
      exp: '0x03',
      mod: '0xe932ac92252f585b3a80a4dd76a897c8b7652952fe788f6ec8dd640587a1ee5647670a8ad4c2be0f9fa6e49c605adf77b5174230af7bd50e5d6d6d6d28ccf0a886a514cc72e51d209cc772a52ef419f6a953f3135929588ebe9b351fca61ced78f346fe00dbb6306e5c2a4c6dfc3779af85ab417371cf34d8387b9b30ae46d7a5ff5a655b8d8455f1b94ae736989d60a6f2fd5cadbffbd504c5a756a2e6bb5cecc13bca7503f6df8b52ace5c410997e98809db4dc30d943de4e812a47553dce54844a78e36401d13f77dc650619fed88d8b3926e3d8e319c80c744779ac5d6abe252896950917476ece5e8fc27d5f053d6018d91b502c4787558a002b9283da7',
      result: false,
    };

    // this is the openssl example where sig has been replaced by sig + mod
    const sTooLarge = {
      ...openssl,
      descr: 'returns false if s >= n',
      sig: ethers.toBeHex(ethers.toBigInt(openssl.sig) + ethers.toBigInt(openssl.mod)),
      result: false,
    };

    for (const { descr, data, sig, exp, mod, result } of [openssl, rfc4055, shortN, differentLength, sTooLarge]) {
      it(descr, async function () {
        expect(await this.mock.$pkcs1Sha256(bytes(data), sig, exp, mod)).to.equal(result);
      });
    }
  });
});
