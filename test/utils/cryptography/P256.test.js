const { ethers } = require('hardhat');
const { expect } = require('chai');
const { secp256r1 } = require('@noble/curves/p256');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

// As in ECDSA, signatures are malleable and the tooling produce both high and low S values.
// We need to ensure that the s value is in the lower half of the order of the curve.
const ensureLowerOrderS = ({ s, recovery, ...rest }) => {
  if (s > N / 2n) {
    s = N - s;
    recovery = 1 - recovery;
  }
  return { s, recovery, ...rest };
};

const prepareSignature = (
  privateKey = secp256r1.utils.randomPrivateKey(),
  messageHash = ethers.hexlify(ethers.randomBytes(0x20)),
) => {
  const publicKey = [
    secp256r1.getPublicKey(privateKey, false).slice(0x01, 0x21),
    secp256r1.getPublicKey(privateKey, false).slice(0x21, 0x41),
  ].map(ethers.hexlify);
  const { r, s, recovery } = ensureLowerOrderS(secp256r1.sign(messageHash.replace(/0x/, ''), privateKey));
  const signature = [r, s].map(v => ethers.toBeHex(v, 0x20));

  return { privateKey, publicKey, signature, recovery, messageHash };
};

describe('P256', function () {
  async function fixture() {
    return { mock: await ethers.deployContract('$P256') };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('with signature', function () {
    beforeEach(async function () {
      Object.assign(this, prepareSignature());
    });

    it('verify valid signature', async function () {
      expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
      expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey))
        .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
        .withArgs('0x0000000000000000000000000000000000000100');
    });

    it('recover public key', async function () {
      expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.deep.equal(
        this.publicKey,
      );
    });

    it('reject signature with flipped public key coordinates ([x,y] >> [y,x])', async function () {
      // flip public key
      this.publicKey.reverse();

      expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
      expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
      expect(await this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false; // Flipped public key is not in the curve
    });

    it('reject signature with flipped signature values ([r,s] >> [s,r])', async function () {
      // Preselected signature where `r < N/2` and `s < N/2`
      this.signature = [
        '0x45350225bad31e89db662fcc4fb2f79f349adbb952b3f652eed1f2aa72fb0356',
        '0x513eb68424c42630012309eee4a3b43e0bdc019d179ef0e0c461800845e237ee',
      ];

      // Corresponding hash and public key
      this.messageHash = '0x2ad1f900fe63745deeaedfdf396cb6f0f991c4338a9edf114d52f7d1812040a0';
      this.publicKey = [
        '0x9e30de165e521257996425d9bf12a7d366925614bf204eabbb78172b48e52e59',
        '0x94bf0fe72f99654d7beae4780a520848e306d46a1275b965c4f4c2b8e9a2c08d',
      ];

      // Make sure it works
      expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.true;

      // Flip signature
      this.signature.reverse();

      expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
      expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey))
        .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
        .withArgs('0x0000000000000000000000000000000000000100');
      expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
        this.publicKey,
      );
    });

    it('reject signature with invalid message hash', async function () {
      // random message hash
      this.messageHash = ethers.hexlify(ethers.randomBytes(32));

      expect(await this.mock.$verify(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
      expect(await this.mock.$verifySolidity(this.messageHash, ...this.signature, ...this.publicKey)).to.be.false;
      await expect(this.mock.$verifyNative(this.messageHash, ...this.signature, ...this.publicKey))
        .to.be.revertedWithCustomError(this.mock, 'MissingPrecompile')
        .withArgs('0x0000000000000000000000000000000000000100');
      expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
        this.publicKey,
      );
    });

    it('fail to recover signature with invalid recovery bit', async function () {
      // flip recovery bit
      this.recovery = 1 - this.recovery;

      expect(await this.mock.$recovery(this.messageHash, this.recovery, ...this.signature)).to.not.deep.equal(
        this.publicKey,
      );
    });

    it('handle valid signature that fails)', async function () {
      const h = '0x04A269853DD4649297D51BC805E5725BCACE6DB4B6DA113294ED8C934539DD95';
      const qx = '0x3B12F048D6222C9E7D2CE9126F434A2DA720F75F6C832FDDFB849E271EABCA38';
      const qy = '0x5E56E10E47BA51512E3E53B62BAB68D9B2030A937C6D88BA890B4A7159F8215B';
      const r = '0x5215E73F36CD577003F8A4F0FB9611D8915B995BA31D9AD493DCAB1FC80E9ED4';
      const s = '0x3BD0F571BDD0A99A68BE9E87BD5BF7E2990FB9EE7D0C63B55EA68B7A9C34E367';

      expect(await this.mock.$verifySolidity(h, r, s, qx, qy)).to.be.true;
    });

    it('handle invalid signature from passing)', async function () {
      const h = '0x2CF0B65CD29F23A02F3A4AFD82223B3FB332027C5408735829365837050DD88A';
      const qx = '0x3B12F048D6222C9E7D2CE9126F434A2DA720F75F6C832FDDFB849E271EABCA38';
      const qy = '0x5E56E10E47BA51512E3E53B62BAB68D9B2030A937C6D88BA890B4A7159F8215B';
      const r = '0x56CDD847E49A573836F4746E1219E176D69AEE09998D66FB199443AFB6668DA5';
      const s = '0x119E2A4AF3FE7B1F4217F94D44FD5589C28763FD0C51FC5A45A7901A9212F380';

      expect(await this.mock.$verifySolidity(h, r, s, qx, qy)).to.be.false;
    });

    it('handle recover pubkey spoof)', async function () {
      const h = '0x108F25197B64C42988B4FC0B7DBD528658DB7590FAC6DC9060E7C8ADA2F2B2AE';
      const r = '0x3B12F048D6222C9E7D2CE9126F434A2DA720F75F6C832FDDFB849E271EABCA38';
      const s = '0x1F71302D5F37A3CA6E9F29C1376789A0377CADA9FB2C9AC9A8F2CFA9DF91D545';

      const qs = [
        '0xCA97E2A99C3077D945EDEA7269331D0BBBDF51A2737C3D4F156BB868FA113D7B',
        '0xC079440D77FCD8D6627E73C2FAEA06C6B84B10C5BD23FD4A3FDA2D8ED03E20FE',
      ];

      expect(await this.mock.$recovery(h, 1, r, s)).to.deep.equal(qs);
    });

    it('handle recover pubkey spoof 2)', async function () {
      const h = '0x37032036792ADB8D8823E6BBE14BB4BD9BD7A1B33B01D336E3CC91AC89626B0E';
      const r = '0x3B12F048D6222C9E7D2CE9126F434A2DA720F75F6C832FDDFB849E271EABCA38';
      const s = '0x1E94FD14042D18A27ADD5703054D06AC8F0688A3456CCF56541B2216345ED0FA';

      const qs = [
        '0x8F7C516A301134DBC9736E2037F13BA01DC28A669D19C2F93BC799FA54BF7C3C',
        '0x6C57D1848CE1D7353F415B623F22670FDD71307CEFC4C1CBD17E1BCCE5FD0FE1',
      ];

      expect(await this.mock.$recovery(h, 1, r, s)).to.deep.equal(qs);
    });
  });

  // test cases for https://github.com/C2SP/wycheproof/blob/4672ff74d68766e7785c2cac4c597effccef2c5c/testvectors/ecdsa_secp256r1_sha256_p1363_test.json
  describe('wycheproof tests', function () {
    for (const { key, tests } of require('./ecdsa_secp256r1_sha256_p1363_test.json').testGroups) {
      // parse public key
      let [x, y] = [key.wx, key.wy].map(v => ethers.stripZerosLeft('0x' + v, 32));
      if (x.length > 66 || y.length > 66) continue;
      x = ethers.zeroPadValue(x, 32);
      y = ethers.zeroPadValue(y, 32);

      // run all tests for this key
      for (const { tcId, comment, msg, sig, result } of tests) {
        // only keep properly formatted signatures
        if (sig.length != 128) continue;

        it(`${tcId}: ${comment}`, async function () {
          // split signature, and reduce modulo N
          let [r, s] = Array(2)
            .fill()
            .map((_, i) => ethers.toBigInt('0x' + sig.substring(64 * i, 64 * (i + 1))));
          // move s to lower part of the curve if needed
          if (s <= N && s > N / 2n) s = N - s;
          // prepare signature
          r = ethers.toBeHex(r, 32);
          s = ethers.toBeHex(s, 32);
          // hash
          const messageHash = ethers.sha256('0x' + msg);

          // check verify
          expect(await this.mock.$verify(messageHash, r, s, x, y)).to.equal(result == 'valid');
        });
      }
    }
  });
});
