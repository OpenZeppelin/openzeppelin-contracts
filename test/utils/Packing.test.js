const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { generators } = require('../helpers/random');

async function fixture() {
  return { mock: await ethers.deployContract('$Packing') };
}

describe('Packing', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('Uint128x2', async function () {
    const high = generators.uint256() % 2n ** 128n;
    const low = generators.uint256() % 2n ** 128n;
    const packed = ethers.hexlify(ethers.toBeArray((high << 128n) | low));

    expect(await this.mock.$asUint128x2(packed)).to.equal(packed);
    expect(await this.mock.$asBytes32(packed)).to.equal(packed);
    expect(await this.mock.$pack(high, low)).to.equal(packed);
    expect(await this.mock.$split(packed)).to.deep.equal([high, low]);
    expect(await this.mock.$high(packed)).to.equal(high);
    expect(await this.mock.$low(packed)).to.equal(low);
  });
});
