import { network } from 'hardhat';
import { shouldBehaveLikeNonces } from './Nonces.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.connect();

async function fixture() {
  return { mock: await ethers.deployContract('$Nonces') };
}

describe('Nonces', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeNonces();
});
