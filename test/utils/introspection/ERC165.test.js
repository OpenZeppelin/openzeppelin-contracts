const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

async function fixture() {
  return {
    mock: await ethers.deployContract('$ERC165'),
  };
}

contract('ERC165', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldSupportInterfaces(['ERC165']);
});
