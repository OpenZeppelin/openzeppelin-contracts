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

    expect(await this.mock.$asPackedBytes32(ethers.Typed.bytes32(packed))).to.equal(packed);
    expect(await this.mock.$asPackedBytes32(ethers.Typed.uint256(packed))).to.equal(packed);
    expect(await this.mock.$asBytes32(packed)).to.equal(packed);
    expect(await this.mock.$asUint256(packed)).to.equal(packed);

    expect(await this.mock.$pack(ethers.Typed.bytes16(first), ethers.Typed.bytes16(second))).to.equal(packed);
    expect(await this.mock.$extract16(packed, 0x00)).to.deep.equal(first);
    expect(await this.mock.$extract16(packed, 0x10)).to.deep.equal(second);
  });
});
