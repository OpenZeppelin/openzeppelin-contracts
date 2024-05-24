const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { forceDeployCode } = require('../helpers/deploy');

async function fixture() {
  return { mock: await forceDeployCode('$Packing') };
}

describe('Packing', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('bytes16 x2 <=> bytes32', async function () {
    const first = ethers.hexlify(ethers.randomBytes(16));
    const second = ethers.hexlify(ethers.randomBytes(16));
    const packed = ethers.hexlify(ethers.toBeArray((ethers.toBigInt(first) << 128n) | ethers.toBigInt(second)));

    expect(await this.mock.$asPackedBytes32(ethers.Typed.bytes32(packed))).to.equal(packed);
    expect(await this.mock.$asPackedBytes32(ethers.Typed.uint256(packed))).to.equal(packed);
    expect(await this.mock.$asBytes32(packed)).to.equal(packed);
    expect(await this.mock.$asUint256(packed)).to.equal(packed);

    expect(await this.mock.$pack(ethers.Typed.bytes16(first), ethers.Typed.bytes16(second))).to.equal(packed);
    expect(await this.mock.$extract16(ethers.Typed.bytes32(packed), 0x00)).to.deep.equal(first);
    expect(await this.mock.$extract16(ethers.Typed.bytes32(packed), 0x10)).to.deep.equal(second);
  });
});
