import { network } from 'hardhat';
import { shouldBehaveLikeProxy } from '../Proxy.behaviour';
import { shouldBehaveLikeTransparentUpgradeableProxy } from './TransparentUpgradeableProxy.behaviour';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

async function fixture() {
  const [owner, other, ...accounts] = await ethers.getSigners();

  const implementation = await ethers.deployContract('DummyImplementation');

  const createProxy = function (logic, initData, opts = undefined) {
    return ethers.deployContract('TransparentUpgradeableProxy', [logic, owner, initData], opts);
  };

  return { nonContractAddress: owner, owner, other, accounts, implementation, createProxy };
}

describe('TransparentUpgradeableProxy', function () {
  before(function () {
    Object.assign(this, connection);
  });

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeProxy();

  // createProxy, owner, otherAccounts
  shouldBehaveLikeTransparentUpgradeableProxy();
});
