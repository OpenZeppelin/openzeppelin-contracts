const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeRegularContext } = require('../utils/Context.behavior');

async function fixture() {
  const [sender] = await ethers.getSigners();

  const context = await ethers.deployContract('ContextMock', []);
  const caller = await ethers.deployContract('ContextMockCaller', []);

  return { sender, context, caller };
}

describe('Context', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeRegularContext();
});
