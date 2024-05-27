const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { forceDeployCode } = require('../helpers/deploy');
const { product } = require('../helpers/iterate');
const { capitalize } = require('../helpers/strings');
const { TYPES } = require('../../scripts/generate/templates/Packing.opts');

async function fixture() {
  return { mock: await forceDeployCode('$Packing') };
}

describe('Packing', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('casting', function () {
    for (const { size, bytes, uint } of TYPES) {
      it(`Packed${capitalize(bytes)}`, async function () {
        const valueAsBytes = ethers.Typed[bytes](ethers.hexlify(ethers.randomBytes(size)));
        const valueAsUint = ethers.Typed[uint](ethers.toBigInt(valueAsBytes.value));

        expect(
          await Promise.all([
            this.mock.getFunction(`$asPacked${capitalize(bytes)}`)(valueAsBytes),
            this.mock.getFunction(`$asPacked${capitalize(bytes)}`)(valueAsUint),
            this.mock.getFunction(`$as${capitalize(bytes)}`)(valueAsBytes),
            this.mock.getFunction(`$as${capitalize(uint)}`)(valueAsBytes),
          ]),
        ).to.deep.equal([valueAsBytes.value, valueAsBytes.value, valueAsBytes.value, valueAsUint.value]);
      });
    }
  });

  describe('pack and extract', function () {
    for (const [t1, t2] of product(TYPES, TYPES).filter(([t1, t2]) => t1.size + t2.size <= 32)) {
      const t3 = TYPES.find(t => t.size == t1.size + t2.size);

      it(`${t1.bytes} + ${t2.bytes} <> ${t3.bytes}`, async function () {
        const left = ethers.Typed[t1.bytes](ethers.hexlify(ethers.randomBytes(t1.size)));
        const right = ethers.Typed[t2.bytes](ethers.hexlify(ethers.randomBytes(t2.size)));
        const packed = ethers.Typed[t3.bytes](ethers.concat([left.value, right.value]));

        expect(
          await Promise.all([
            this.mock.getFunction('$pack')(left, right),
            this.mock.getFunction(`$extract${t1.size}`)(packed, 0),
            this.mock.getFunction(`$extract${t2.size}`)(packed, t1.size),
          ]),
        ).to.deep.equal([packed.value, left.value, right.value]);
      });
    }
  });
});
