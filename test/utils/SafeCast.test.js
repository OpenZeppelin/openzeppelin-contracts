const { contract } = require('@openzeppelin/test-environment');
const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const SafeCastMock = contract.fromArtifact('SafeCastMock');

describe('SafeCast', async () => {
  beforeEach(async function () {
    this.safeCast = await SafeCastMock.new();
  });

  function testToUint (bits) {
    describe(`toUint${bits}`, () => {
      const maxValue = new BN('2').pow(new BN(bits)).subn(1);

      it('downcasts 0', async function () {
        expect(await this.safeCast[`toUint${bits}`](0)).to.be.bignumber.equal('0');
      });

      it('downcasts 1', async function () {
        expect(await this.safeCast[`toUint${bits}`](1)).to.be.bignumber.equal('1');
      });

      it(`downcasts 2^${bits} - 1 (${maxValue})`, async function () {
        expect(await this.safeCast[`toUint${bits}`](maxValue)).to.be.bignumber.equal(maxValue);
      });

      it(`reverts when downcasting 2^${bits} (${maxValue.addn(1)})`, async function () {
        await expectRevert(
          this.safeCast[`toUint${bits}`](maxValue.addn(1)),
          `SafeCast: value doesn't fit in ${bits} bits`
        );
      });

      it(`reverts when downcasting 2^${bits} + 1 (${maxValue.addn(2)})`, async function () {
        await expectRevert(
          this.safeCast[`toUint${bits}`](maxValue.addn(2)),
          `SafeCast: value doesn't fit in ${bits} bits`
        );
      });
    });
  }

  [8, 16, 32, 64, 128].forEach(bits => testToUint(bits));
});
