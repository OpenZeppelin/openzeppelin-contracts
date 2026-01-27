import { network } from 'hardhat';
import { expect } from 'chai';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.connect();

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
});
