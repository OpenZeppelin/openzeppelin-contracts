import { network } from 'hardhat';
import { shouldBehaveLikeNonces, shouldBehaveLikeNoncesKeyed } from './Nonces.behavior';

const {
  ethers,
  networkHelpers: { loadFixture },
} = await network.connect();

async function fixture() {
  return { mock: await ethers.deployContract('$NoncesKeyed') };
}

describe('NoncesKeyed', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeNonces();
  shouldBehaveLikeNoncesKeyed();
});
