import { network, globalOptions } from 'hardhat';
import { expect } from 'chai';
import * as random from '../helpers/random';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

async function fixture() {
  return { mock: await ethers.deployContract('$Base58') };
}

describe('Base58', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('base58', function () {
    describe('encode/decode random buffers', function () {
      // length 512 runs out of gas.
      // When coverage is enabled, only consider length up to 32 (to avoid CI timeouts)
      for (const length of [0, 1, 2, 3, 4, 32, 42, 128, 384].filter(l => !globalOptions.coverage || l <= 32))
        it(`buffer of length ${length}`, async function () {
          const buffer = random.bytes(length);
          const hex = ethers.hexlify(buffer);
          const b58 = ethers.encodeBase58(buffer);

          await expect(this.mock.$encode(hex)).to.eventually.equal(b58);
          await expect(this.mock.$decode(b58)).to.eventually.equal(hex);
        });
    });

    // Tests case from section 5 of the (no longer active) Base58 Encoding Scheme RFC
    // https://datatracker.ietf.org/doc/html/draft-msporny-base58-03
    describe('test vectors', function () {
      for (const { raw, b58 } of [
        { raw: 'Hello World!', b58: '2NEpo7TZRRrLZSi2U' },
        {
          raw: 'The quick brown fox jumps over the lazy dog.',
          b58: 'USm3fpXnKG5EUBx2ndxBDMPVciP5hGey2Jh4NDv6gmeo1LkMeiKrLJUUBk6Z',
        },
        { raw: '0x0000287fb4cd', b58: '11233QC4' },
      ])
        it(raw, async function () {
          const buffer = (ethers.isHexString(raw) ? ethers.getBytes : ethers.toUtf8Bytes)(raw);
          const hex = ethers.hexlify(buffer);

          await expect(this.mock.$encode(hex)).to.eventually.equal(b58);
          await expect(this.mock.$decode(b58)).to.eventually.equal(hex);
        });
    });

    describe('decode invalid format', function () {
      for (const chr of ['I', '-', '~'])
        it(`Invalid base58 char ${chr}`, async function () {
          const getHexCode = str => ethers.hexlify(ethers.toUtf8Bytes(str));
          const helper = { interface: ethers.Interface.from(['error InvalidBase58Char(bytes1)']) };

          await expect(this.mock.$decode(`VYRWKp${chr}pnN7`))
            .to.be.revertedWithCustomError(helper, 'InvalidBase58Char')
            .withArgs(getHexCode(chr));
        });
    });
  });
});
