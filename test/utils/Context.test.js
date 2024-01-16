const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeRegularContext } = require('./Context.behavior');

async function fixture() {
  const [sender] = await ethers.getSigners();
  const context = await ethers.deployContract('ContextMock', []);
  return { sender, context };
}

describe('Context', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeRegularContext();
});
