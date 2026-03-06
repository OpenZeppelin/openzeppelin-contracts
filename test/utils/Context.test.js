import { network } from 'hardhat';
import { shouldBehaveLikeRegularContext } from './Context.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.connect();

async function fixture() {
  const [sender] = await ethers.getSigners();
  const context = await ethers.deployContract('ContextMock', []);
  const contextHelper = await ethers.deployContract('ContextMockCaller', []);
  return { sender, context, contextHelper };
}

describe('Context', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeRegularContext();
});
