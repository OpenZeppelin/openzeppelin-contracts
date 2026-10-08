import { network } from 'hardhat';
import { expect } from 'chai';
import * as random from '../helpers/random';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

const formatSlice = ({ ptr = 0xa0, length = 0n }) =>
  ethers.toBeHex((ethers.toBigInt(length) << 128n) | ethers.toBigInt(ptr), 32);

async function fixture() {
  return { mock: await ethers.deployContract('$Memory') };
}

describe('Memory', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('Pointer', function () {
    describe('free pointer', function () {
      it('sets free memory pointer', async function () {
        const ptr = ethers.toBeHex(0xa0, 32);
        await expect(this.mock.$unsafeSetFreeMemoryPointer(ptr)).to.not.be.revert(ethers);
      });

      it('gets free memory pointer', async function () {
        await expect(this.mock.$getFreeMemoryPointer()).to.eventually.equal(
          ethers.toBeHex(0x80, 32), // Default pointer
        );
      });
    });
  });

  describe('Slices', function () {
    it('asSlice', async function () {
      for (const length of [0, 20, 32, 256]) {
        const buffer = random.bytes(length);
        await expect(this.mock.$asSlice(buffer)).to.eventually.equal(formatSlice({ length }));
      }
    });

    it('length', async function () {
      for (const ptr of ['0x00', '0xa0', '0x42a0']) {
        for (const length of [0, 20, 32, 256]) {
          await expect(this.mock.$length_Memory_Slice(formatSlice({ length, ptr }))).to.eventually.equal(length);
          await expect(this.mock.$length_Memory_ConstSlice(formatSlice({ length, ptr }))).to.eventually.equal(length);
        }
      }
    });

    for (const [descr, fn] of Object.entries({
      'slice(Slice,uint256)': '$slice_Memory_Slice(bytes32,uint256)',
      'slice(ConstSlice,uint256)': '$slice_Memory_ConstSlice(bytes32,uint256)',
    })) {
      it(descr, async function () {
        for (const { input, start, output } of [
          { input: { ptr: 256n, length: 0n }, start: 0n, output: { ptr: 256n, length: 0n } }, // empty + everything => empty
          { input: { ptr: 256n, length: 10n }, start: 0n, output: { ptr: 256n, length: 10n } }, // non empty + everything => identical
          { input: { ptr: 256n, length: 10n }, start: 8n, output: { ptr: 264n, length: 2n } }, // non empty + offset => moved slice
          { input: { ptr: 256n, length: 10n }, start: 10n, output: { ptr: 266n, length: 0n } }, // non empty + start at end => empty
          { input: { ptr: 256n, length: 0n }, start: 1n, output: { ptr: 256n, length: 0n } }, // empty + offset => empty
          { input: { ptr: 256n, length: 10n }, start: 11n, output: { ptr: 266n, length: 0n } }, // non empty + start after end => empty
        ]) {
          await expect(this.mock.getFunction(fn)(formatSlice(input), start)).to.eventually.equal(formatSlice(output));
        }
      });
    }

    for (const [descr, fn] of Object.entries({
      'slice(Slice,uint256,uint256)': '$slice_Memory_Slice(bytes32,uint256,uint256)',
      'slice(ConstSlice,uint256,uint256)': '$slice_Memory_ConstSlice(bytes32,uint256,uint256)',
    })) {
      it(descr, async function () {
        for (const { input, start, end, output } of [
          { input: { ptr: 256n, length: 0n }, start: 0n, end: 0n, output: { ptr: 256n, length: 0n } }, // empty + empty => empty
          { input: { ptr: 256n, length: 10n }, start: 0n, end: 10n, output: { ptr: 256n, length: 10n } }, // non empty + everything => identical
          { input: { ptr: 256n, length: 10n }, start: 0n, end: 4n, output: { ptr: 256n, length: 4n } }, // non empty + section at beginning => slice
          { input: { ptr: 256n, length: 10n }, start: 4n, end: 8n, output: { ptr: 260n, length: 4n } }, // non empty + section in the middle => slice
          { input: { ptr: 256n, length: 0n }, start: 0n, end: 1n, output: { ptr: 256n, length: 0n } }, // empty + section past the end => empty
          { input: { ptr: 256n, length: 10n }, start: 6n, end: 12n, output: { ptr: 262n, length: 4n } }, // non empty + section past the end => slice
        ]) {
          await expect(this.mock.getFunction(fn)(formatSlice(input), start, end)).to.eventually.equal(
            formatSlice(output),
          );
        }
      });
    }
  });
});
