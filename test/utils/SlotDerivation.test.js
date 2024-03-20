const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { erc1967slot, erc7201slot } = require('../helpers/storage');

async function fixture() {
  const [account] = await ethers.getSigners();
  const mock = await ethers.deployContract('$SlotDerivation');
  return { mock, account };
}

describe('SlotDerivation', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('namespaces', function () {
    const namespace = 'example.main';

    it('erc-1967', async function () {
      expect(await this.mock.$erc1967slot(namespace)).to.equal(erc1967slot(namespace));
    });

    it('erc-7201', async function () {
      expect(await this.mock.$erc7201slot(namespace)).to.equal(erc7201slot(namespace));
    });
  });
});
