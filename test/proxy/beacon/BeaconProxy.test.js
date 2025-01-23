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
    it('rejects non-contract beacon', async function () {
      const notBeacon = this.other;
      await expect(this.newBeaconProxy(notBeacon, '0x'))
        .to.be.revertedWithCustomError(this.factory, 'ERC1967InvalidBeacon')
        .withArgs(notBeacon);
    });

    it('rejects non-compliant beacon', async function () {
      const badBeacon = await ethers.deployContract('BadBeaconNoImpl');
      await expect(this.newBeaconProxy(badBeacon, '0x')).to.be.revertedWithoutReason();
    });

    it('rejects beacon with non-contract implementation', async function () {
      const badBeacon = await ethers.deployContract('BadBeaconNotContract');
      await expect(this.newBeaconProxy(badBeacon, '0x'))
        .to.be.revertedWithCustomError(this.factory, 'ERC1967InvalidImplementation')
        .withArgs(await badBeacon.implementation());
    });
  });

  describe('initialization', function () {
    async function assertInitialized({ value, balance }) {
      const beaconAddress = await getAddressInSlot(this.proxy, BeaconSlot);
      expect(beaconAddress).to.equal(this.beacon.address);

      const dummy = this.v1.attach(this.proxy);
      expect(await dummy.value()).to.equal(value);
      expect(await ethers.provider.getBalance(this.proxy)).to.equal(balance);
    }

    it('initializes without data', async function () {
      this.proxy = await this.newBeaconProxy(this.beacon, '0x');
      await assertInitialized.call(this, { value: 0n, balance: 0n });
    });

    it('initializes with non-payable data', async function () {
      const value = 55n;
      const data = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value]);
      this.proxy = await this.newBeaconProxy(this.beacon, data);
      await assertInitialized.call(this, { value, balance: 0n });
    });

    it('initializes with payable data', async function () {
      const value = 55n;
      const data = this.v1.interface.encodeFunctionData('initializePayableWithValue', [value]);
      const balance = 100n;
      this.proxy = await this.newBeaconProxy(this.beacon, data, { value: balance });
      await assertInitialized.call(this, { value, balance });
    });

    it('rejects initialization with non-payable value', async function () {
      await expect(this.newBeaconProxy(this.beacon, '0x', { value: 1n }))
        .to.be.revertedWithCustomError(this.factory, 'ERC1967NonPayable');
    });

    it('rejects initialization with reverting function', async function () {
      const data = this.v1.interface.encodeFunctionData('reverts');
      await expect(this.newBeaconProxy(this.beacon, data)).to.be.revertedWith('DummyImplementation reverted');
    });
  });

  describe('upgrade', function () {
    it('upgrades a proxy through its beacon', async function () {
      const value = 10n;
      const data = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value]);
      const proxy = await this.newBeaconProxy(this.beacon, data).then(instance => this.v1.attach(instance));

      expect(await proxy.value()).to.equal(value);
      expect(await proxy.version()).to.equal('V1');

      await this.beacon.connect(this.admin).upgradeTo(this.v2);
      expect(await proxy.version()).to.equal('V2');
    });

    it('upgrades multiple proxies through a shared beacon', async function () {
      const value1 = 10n;
      const data1 = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value1]);
      const proxy1 = await this.newBeaconProxy(this.beacon, data1).then(instance => this.v1.attach(instance));

      const value2 = 42n;
      const data2 = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [value2]);
      const proxy2 = await this.newBeaconProxy(this.beacon, data2).then(instance => this.v1.attach(instance));

      expect(await proxy1.value()).to.equal(value1);
      expect(await proxy2.value()).to.equal(value2);
      expect(await proxy1.version()).to.equal('V1');
      expect(await proxy2.version()).to.equal('V1');

      await this.beacon.connect(this.admin).upgradeTo(this.v2);
      expect(await proxy1.version()).to.equal('V2');
      expect(await proxy2.version()).to.equal('V2');
    });
  });
});
