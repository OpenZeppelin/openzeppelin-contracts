import { network } from 'hardhat';
import {
  DEFAULT_ADMIN_ROLE,
  shouldBehaveLikeAccessControl,
  shouldBehaveLikeAccessControlEnumerable,
} from '../AccessControl.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

async function fixture() {
  const [defaultAdmin, ...accounts] = await ethers.getSigners();
  const mock = await ethers.deployContract('$AccessControlEnumerable');
  await mock.$_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
  return { mock, defaultAdmin, accounts };
}

describe('AccessControlEnumerable', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));
  });

  shouldBehaveLikeAccessControl();
  shouldBehaveLikeAccessControlEnumerable();
});
