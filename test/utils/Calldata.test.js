import { network } from 'hardhat';
import { expect } from 'chai';
import { CALLDATA_ARRAY_TYPES } from '../../scripts/generate/data.js';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

async function fixture() {
  return { mock: await ethers.deployContract('$Calldata') };
}

describe('Calldata utilities', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('emptyBytes', async function () {
    await expect(this.mock.$emptyBytes()).to.eventually.equal('0x');
  });

  it('emptyString', async function () {
    await expect(this.mock.$emptyString()).to.eventually.equal('');
  });

  for (const { name } of CALLDATA_ARRAY_TYPES) {
    it(`empty${name}Array`, async function () {
      await expect(this.mock[`$empty${name}Array`]()).to.eventually.deep.equal([]);
    });
  }
});
