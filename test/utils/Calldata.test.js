import { network } from 'hardhat';
import { expect } from 'chai';
import { TYPES } from '../../scripts/generate/data.js';

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

  for (const { name, zero } of Object.values(TYPES).filter(type => !type.size)) {
    it(`empty${name}`, async function () {
      await expect(this.mock[`$empty${name}`]()).to.eventually.equal(zero);
    });
  }

  for (const { name } of Object.values(TYPES).filter(type => !type.upcastTo)) {
    it(`empty${name}Array`, async function () {
      await expect(this.mock[`$empty${name}Array`]()).to.eventually.deep.equal([]);
    });
  }
});
