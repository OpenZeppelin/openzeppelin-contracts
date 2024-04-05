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
    const first = generators.uint256() % 2n ** 128n;
    const second = generators.uint256() % 2n ** 128n;
    const packed = ethers.hexlify(ethers.toBeArray((first << 128n) | second));

    expect(await this.mock.$asUint128x2(packed)).to.equal(packed);
    expect(await this.mock.$asBytes32(packed)).to.equal(packed);
    expect(await this.mock.$pack(first, second)).to.equal(packed);
    expect(await this.mock.$split(packed)).to.deep.equal([first, second]);
    expect(await this.mock.$first(packed)).to.equal(first);
    expect(await this.mock.$second(packed)).to.equal(second);
  });
});
