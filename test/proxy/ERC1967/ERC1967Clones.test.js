const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { generators } = require('../../helpers/random');
const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const fixture = async () => {
  const [admin, nonContractAddress] = await ethers.getSigners();

  const factory = await ethers.deployContract('$ERC1967Clones');
  const implementation = await ethers.deployContract('DummyImplementation');

  return { admin, nonContractAddress, factory, implementation };
};

describe('ERC1967Clones', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('non-deterministic deployment (create)', function () {
    before(function () {
      this.createProxy = async (implementation, initData, opts = {}) => {
        const tx = await this.factory.$deploy(implementation, 0n);
        const instance = await tx
          .wait()
          .then(receipt => receipt.logs.find(ev => ev.fragment.name === 'return$deploy').args[0])
          .then(addr => new ethers.Contract(addr, [], this.admin, tx));
        if (initData !== '0x' || opts.value > 0n) {
          await this.admin.sendTransaction({ to: instance.target, data: initData, ...opts });
        }
        return instance;
      };
    });

    shouldBehaveLikeProxy({ allowUninitialized: true, allowNonContractAddress: true });
  });

  describe('deterministic deployment (create)', function () {
    before(function () {
      this.createProxy = async (implementation, initData, opts = {}) => {
        const tx = await this.factory.$deployDeterministic(implementation, 0n, opts.salt ?? generators.bytes32());
        const instance = await tx
          .wait()
          .then(receipt => receipt.logs.find(ev => ev.fragment.name === 'return$deployDeterministic').args[0])
          .then(addr => new ethers.Contract(addr, [], this.admin, tx));
        if (initData !== '0x' || opts.value > 0n) {
          await this.admin.sendTransaction({ to: instance.target, data: initData, ...opts });
        }
        return instance;
      };
    });

    shouldBehaveLikeProxy({ allowUninitialized: true, allowNonContractAddress: true });
  });
});
