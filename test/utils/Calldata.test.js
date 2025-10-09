const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const mock = await ethers.deployContract('$Calldata');
  return { mock };
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
