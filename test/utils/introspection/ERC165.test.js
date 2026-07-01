import { network } from 'hardhat';
import { shouldSupportInterfaces } from './SupportsInterface.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.create();

async function fixture() {
  return { mock: await ethers.deployContract('$ERC165') };
}

describe('ERC165', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldSupportInterfaces();
});
