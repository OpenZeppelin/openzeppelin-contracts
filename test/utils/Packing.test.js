const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { forceDeployCode } = require('../helpers/deploy');
const { product } = require('../helpers/iterate');
const { capitalize } = require('../helpers/strings');
const { TYPES, findType } = require('../../scripts/generate/templates/Packing.opts');

async function fixture() {
  return { mock: await forceDeployCode('$Packing') };
}

describe('Packing', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('casting', function () {
    for (const { size, bytes, uint } of TYPES) {
      const valueAsBytes = ethers.Typed[bytes](ethers.hexlify(ethers.randomBytes(size)));
      const valueAsUint = ethers.Typed[uint](ethers.toBigInt(valueAsBytes.value));

      it(`Packed${capitalize(bytes)}`, async function () {
        this.values = [
          {
            promise: this.mock.getFunction(`$asPacked${capitalize(bytes)}`)(valueAsBytes),
            expected: valueAsBytes.value,
          },
          {
            promise: this.mock.getFunction(`$asPacked${capitalize(bytes)}`)(valueAsUint),
            expected: valueAsBytes.value,
          },
          { promise: this.mock.getFunction(`$as${capitalize(bytes)}`)(valueAsBytes), expected: valueAsBytes.value },
          { promise: this.mock.getFunction(`$as${capitalize(uint)}`)(valueAsBytes), expected: valueAsUint.value },
        ];

        if (size == 20) {
          const valueAsAddress = ethers.Typed.address(valueAsBytes.value);
          this.values.push(
            {
              promise: this.mock.getFunction(`$asPacked${capitalize(bytes)}`)(valueAsAddress),
              expected: valueAsBytes.value,
            },
            { promise: this.mock.getFunction('$asAddress')(valueAsBytes), expected: valueAsAddress.value },
          );
        }
      });
    }
  });

  describe('pack and extract', function () {
    for (const [t1, t2] of product(TYPES, TYPES)) {
      const t3 = findType(t1.size + t2.size);
      if (t3 == undefined) continue;

      const left = ethers.Typed[t1.bytes](ethers.hexlify(ethers.randomBytes(t1.size)));
      const right = ethers.Typed[t2.bytes](ethers.hexlify(ethers.randomBytes(t2.size)));
      const packed = ethers.Typed[t3.bytes](ethers.concat([left.value, right.value]));

      it(`${t1.bytes} + ${t2.bytes} <> ${t3.bytes}`, async function () {
        this.values = [
          { promise: this.mock.getFunction('$pack')(left, right), expected: packed.value },
          { promise: this.mock.getFunction(`$extract${t1.size}`)(packed, 0), expected: left.value },
          { promise: this.mock.getFunction(`$extract${t2.size}`)(packed, t1.size), expected: right.value },
        ];
      });

      it(`out of range extraction`, async function () {
        await expect(this.mock.getFunction(`$extract${t2.size}`)(packed, t1.size + 1)).to.be.revertedWithCustomError(
          this.mock,
          'OutOfRangeAccess',
        );
      });
    }
  });

  afterEach(async function () {
    expect(await Promise.all((this.values ?? []).map(({ promise }) => promise))).to.deep.equal(
      (this.values ?? []).map(({ expected }) => expected),
    );
  });
});
