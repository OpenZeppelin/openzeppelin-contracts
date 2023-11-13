const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('Arrays', function () {
  describe('findUpperBound', function () {
    describe('Even number of elements', function () {
      const EVEN_ELEMENTS_ARRAY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

      const fixture = async () => {
        const arrays = await ethers.deployContract('Uint256ArraysMock', [EVEN_ELEMENTS_ARRAY]);
        return { arrays };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      it('returns correct index for the basic case', async function () {
        expect(await this.arrays.findUpperBound(16)).to.be.equal(5n);
      });

      it('returns 0 for the first element', async function () {
        expect(await this.arrays.findUpperBound(11)).to.be.equal(0n);
      });

      it('returns index of the last element', async function () {
        expect(await this.arrays.findUpperBound(20)).to.be.equal(9n);
      });

      it('returns first index after last element if searched value is over the upper boundary', async function () {
        expect(await this.arrays.findUpperBound(32)).to.be.equal(10n);
      });

      it('returns 0 for the element under the lower boundary', async function () {
        expect(await this.arrays.findUpperBound(2)).to.be.equal(0n);
      });
    });

    describe('Odd number of elements', function () {
      const ODD_ELEMENTS_ARRAY = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

      const fixture = async () => {
        const arrays = await ethers.deployContract('Uint256ArraysMock', [ODD_ELEMENTS_ARRAY]);
        return { arrays };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      it('returns correct index for the basic case', async function () {
        expect(await this.arrays.findUpperBound(16)).to.be.equal(5n);
      });

      it('returns 0 for the first element', async function () {
        expect(await this.arrays.findUpperBound(11)).to.be.equal(0n);
      });

      it('returns index of the last element', async function () {
        expect(await this.arrays.findUpperBound(21)).to.be.equal(10n);
      });

      it('returns first index after last element if searched value is over the upper boundary', async function () {
        expect(await this.arrays.findUpperBound(32)).to.be.equal(11n);
      });

      it('returns 0 for the element under the lower boundary', async function () {
        expect(await this.arrays.findUpperBound(2)).to.be.equal(0n);
      });
    });

    describe('Array with gap', function () {
      const WITH_GAP_ARRAY = [11, 12, 13, 14, 15, 20, 21, 22, 23, 24];

      const fixture = async () => {
        const arrays = await ethers.deployContract('Uint256ArraysMock', [WITH_GAP_ARRAY]);
        return { arrays };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      it('returns index of first element in next filled range', async function () {
        expect(await this.arrays.findUpperBound(17)).to.be.equal(5n);
      });
    });

    context('Empty array', function () {
      beforeEach(async function () {
        this.arrays = await ethers.deployContract('Uint256ArraysMock', [[]]);
      });

      it('always returns 0 for empty array', async function () {
        expect(await this.arrays.findUpperBound(10)).to.be.equal(0n);
      });
    });
  });

  describe('unsafeAccess', function () {
    for (const { type, artifact, elements } of [
      {
        type: 'address',
        artifact: 'AddressArraysMock',
        elements: Array(10)
          .fill()
          .map(() => ethers.Wallet.createRandom().address),
      },
      {
        type: 'bytes32',
        artifact: 'Bytes32ArraysMock',
        elements: Array(10)
          .fill()
          .map(() => ethers.hexlify(ethers.randomBytes(32))),
      },
      {
        type: 'uint256',
        artifact: 'Uint256ArraysMock',
        elements: Array(10)
          .fill()
          .map(() => ethers.hexlify(ethers.randomBytes(32))),
      },
    ]) {
      it(type, async function () {
        const contract = await ethers.deployContract(artifact, [elements]);

        for (const i in elements) {
          expect(await contract.unsafeAccess(i)).to.be.equal(elements[i]);
        }
      });
    }
  });
});
