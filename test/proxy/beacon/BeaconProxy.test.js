const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getAddressInSlot, BeaconSlot } = require('../../helpers/storage');

async function fixture() {
  const [admin, other] = await ethers.getSigners();

  const v1 = await ethers.deployContract('DummyImplementation');
  const v2 = await ethers.deployContract('DummyImplementationV2');
  const factory = await ethers.getContractFactory('BeaconProxy');
  const beacon = await ethers.deployContract('UpgradeableBeacon', [v1, admin]);

  const newBeaconProxy = (beacon, data, opts = {}) => factory.deploy(beacon, data, opts);

  return { admin, other, factory, beacon, v1, v2, newBeaconProxy };
}

describe('BeaconProxy', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('bad beacon is not accepted', function () {
    it('non-contract beacon', async function () {
      const notBeacon = this.other;

      await expect(this.newBeaconProxy(notBeacon, '0x'))
        .to.be.revertedWithCustomError(this.factory, 'ERC1967InvalidBeacon')
        .withArgs(notBeacon);
    });

    it('non-compliant beacon', async function () {
      const badBeacon = await ethers.deployContract('BadBeaconNoImpl');

      // BadBeaconNoImpl does not provide `implementation()` and has no fallback.
      // This causes ERC1967Utils._setBeacon to revert.
      await expect(this.newBeaconProxy(badBeacon, '0x')).to.be.revertedWithoutReason();
    });

    it('non-contract implementation', async function () {
      const badBeacon = await ethers.deployContract('BadBeaconNotContract');

      await expect(this.newBeaconProxy(badBeacon, '0x'))
        .to.be.revertedWithCustomError(this.factory, 'ERC1967InvalidImplementation')
        .withArgs(await badBeacon.implementation());
    });
  });

  describe('initialization', function () {
    async function assertInitialized({ value, balance }) {
      const beaconAddress = await getAddressInSlot(this.proxy, BeaconSlot);
      expect(beaconAddress).to.equal(this.beacon);

      const dummy = this.v1.attach(this.proxy);
      expect(await dummy.value()).to.equal(value);

      expect(await ethers.provider.getBalance(this.proxy)).to.equal(balance);
    }

    it('no initialization', async function () {
      this.proxy = await this.newBeaconProxy(this.beacon, '0x');
      await assertInitialized.bind(this)({ value: 0n, balance: 0n });
    });

    it('non-payable initialization', async function () {
      const value = 55n;
      const data = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value]);

      this.proxy = await this.newBeaconProxy(this.beacon, data);
      await assertInitialized.bind(this)({ value, balance: 0n });
    });

    it('payable initialization', async function () {
      const value = 55n;
      const data = this.v1.interface.encodeFunctionData('initializePayableWithValue', [value]);
      const balance = 100n;

      this.proxy = await this.newBeaconProxy(this.beacon, data, { value: balance });
      await assertInitialized.bind(this)({ value, balance });
    });

    it('reverting initialization due to value', async function () {
      await expect(this.newBeaconProxy(this.beacon, '0x', { value: 1n })).to.be.revertedWithCustomError(
        this.factory,
        'ERC1967NonPayable',
      );
    });

    it('reverting initialization function', async function () {
      const data = this.v1.interface.encodeFunctionData('reverts');
      await expect(this.newBeaconProxy(this.beacon, data)).to.be.revertedWith('DummyImplementation reverted');
    });
  });

  describe('upgrade', function () {
    it('upgrade a proxy by upgrading its beacon', async function () {
      const value = 10n;
      const data = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value]);
      const proxy = await this.newBeaconProxy(this.beacon, data).then(instance => this.v1.attach(instance));

      // test initial values
      expect(await proxy.value()).to.equal(value);

      // test initial version
      expect(await proxy.version()).to.equal('V1');

      // upgrade beacon
      await this.beacon.connect(this.admin).upgradeTo(this.v2);

      // test upgraded version
      expect(await proxy.version()).to.equal('V2');
    });

    it('upgrade 2 proxies by upgrading shared beacon', async function () {
      const value1 = 10n;
      const data1 = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value1]);
      const proxy1 = await this.newBeaconProxy(this.beacon, data1).then(instance => this.v1.attach(instance));

      const value2 = 42n;
      const data2 = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value2]);
      const proxy2 = await this.newBeaconProxy(this.beacon, data2).then(instance => this.v1.attach(instance));

      // test initial values
      expect(await proxy1.value()).to.equal(value1);
      expect(await proxy2.value()).to.equal(value2);

      // test initial version
      expect(await proxy1.version()).to.equal('V1');
      expect(await proxy2.version()).to.equal('V1');

      // upgrade beacon
      await this.beacon.connect(this.admin).upgradeTo(this.v2);

      // test upgraded version
      expect(await proxy1.version()).to.equal('V2');
      expect(await proxy2.version()).to.equal('V2');
    });
  });
});
