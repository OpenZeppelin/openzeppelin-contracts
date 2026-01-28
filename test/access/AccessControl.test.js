import { network } from 'hardhat';
import { DEFAULT_ADMIN_ROLE, shouldBehaveLikeAccessControl } from './AccessControl.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

async function fixture() {
  const [defaultAdmin, ...accounts] = await ethers.getSigners();
  const mock = await ethers.deployContract('$AccessControl');
  await mock.$_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
  return { mock, defaultAdmin, accounts };
}

describe('AccessControl', function () {
  beforeEach(async function () {
    // write connection to this for use in fixtures
    Object.assign(this, connection, await loadFixture(fixture));
  });

  shouldBehaveLikeAccessControl();
});
