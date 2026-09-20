import { network } from 'hardhat';
import { shouldBehaveLikeProxy } from '../Proxy.behaviour';
import { shouldBehaveLikeTransparentUpgradeableProxy } from './TransparentUpgradeableProxy.behaviour';

const connection = await network.create();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

describe('TransparentUpgradeableProxy', function () {
  before(async function () {
    Object.assign(this, connection);
  });

  describe('(default) deploy ProxyAdmin', function () {
    async function fixture() {
      const [owner, other, ...accounts] = await ethers.getSigners();

      const implementation = await ethers.deployContract('DummyImplementation');

      const createProxy = function (logic, initData, opts = undefined) {
        return ethers.deployContract('TransparentUpgradeableProxy', [logic, owner, initData], opts);
      };

      return { nonContractAddress: owner, owner, other, accounts, implementation, createProxy };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeProxy();

    // createProxy, owner, accounts
    shouldBehaveLikeTransparentUpgradeableProxy();
  });

  describe('(existing admin)', function () {
    async function fixture() {
      const [owner, other, ...accounts] = await ethers.getSigners();

      const implementation = await ethers.deployContract('DummyImplementation');
      const proxyAdmin = await ethers.deployContract('ProxyAdmin', [owner]);

      const createProxy = function (logic, initData, opts = undefined) {
        return ethers.deployContract('TransparentUpgradeableProxyExistingAdmin', [logic, proxyAdmin, initData], opts);
      };

      return { nonContractAddress: owner, owner, other, accounts, implementation, proxyAdmin, createProxy };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeProxy();

    // createProxy, owner, accounts, proxyAdmin
    shouldBehaveLikeTransparentUpgradeableProxy({ deployProxyAdmin: false });
  });
});
