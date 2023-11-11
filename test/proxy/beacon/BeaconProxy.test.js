const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { getAddressInSlot, BeaconSlot } = require('../../helpers/erc1967');

const UpgradeableBeacon = 'UpgradeableBeacon';
const BeaconProxy = 'BeaconProxy';
const DummyImplementation = 'DummyImplementation';
const DummyImplementationV2 = 'DummyImplementationV2';
const BadBeaconNoImpl = 'BadBeaconNoImpl';
const BadBeaconNotContract = 'BadBeaconNotContract';

async function fixture() {
  const [upgradeableBeaconAdmin, anotherAccount] = await ethers.getSigners();

  const implementationV0 = await ethers.deployContract(DummyImplementation);
  const implementationV1 = await ethers.deployContract(DummyImplementationV2);

  const beacon = await ethers.deployContract(UpgradeableBeacon, [implementationV0, upgradeableBeaconAdmin]);

  return { upgradeableBeaconAdmin, anotherAccount, implementationV0, implementationV1, beacon };
}

describe('BeaconProxy', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('bad beacon is not accepted', async function () {
    it('non-contract beacon', async function () {
      const BeaconProxyFactory = await ethers.getContractFactory(BeaconProxy);
      await expect(BeaconProxyFactory.deploy(this.anotherAccount, '0x'))
        .to.be.revertedWithCustomError(BeaconProxyFactory, 'ERC1967InvalidBeacon')
        .withArgs(this.anotherAccount.address);
    });

    it('non-compliant beacon', async function () {
      const beacon = await ethers.deployContract(BadBeaconNoImpl);
      await expect(ethers.deployContract(BeaconProxy, [beacon, '0x'])).to.be.reverted;
    });

    it('non-contract implementation', async function () {
      const beacon = await ethers.deployContract(BadBeaconNotContract);
      const BeaconProxyFactory = await ethers.getContractFactory('BeaconProxy');
      await expect(BeaconProxyFactory.deploy(beacon.target, '0x'))
        .to.be.revertedWithCustomError(BeaconProxyFactory, 'ERC1967InvalidImplementation')
        .withArgs(await beacon.implementation());
    });
  });

  describe('initialization', function () {
    before(function () {
      this.assertInitialized = async ({ value, balance }) => {
        const beaconAddress = await getAddressInSlot(this.proxy, BeaconSlot);
        expect(beaconAddress).to.equal(this.beacon.target);

        const dummy = await ethers.getContractAt(DummyImplementation, this.proxy);
        expect(await dummy.value()).to.eq(value);

        expect(await ethers.provider.getBalance(this.proxy)).to.eq(balance);
      };
    });

    it('no initialization', async function () {
      this.proxy = await ethers.deployContract(BeaconProxy, [this.beacon, '0x']);
      await this.assertInitialized({ value: '0', balance: '0' });
    });

    it('non-payable initialization', async function () {
      const value = '55';
      const data = this.implementationV0.interface.encodeFunctionData('initializeNonPayableWithValue', [value]);
      this.proxy = await ethers.deployContract(BeaconProxy, [this.beacon, data]);
      await this.assertInitialized({ value, balance: '0' });
    });

    it('payable initialization', async function () {
      const value = '55';
      const data = this.implementationV0.interface.encodeFunctionData('initializePayableWithValue', [value]);
      const balance = '100';
      this.proxy = await ethers.deployContract(BeaconProxy, [this.beacon, data], { value: balance });
      await this.assertInitialized({ value, balance });
    });

    it('reverting initialization due to value', async function () {
      const BeaconProxyFactory = await ethers.getContractFactory('BeaconProxy');
      await expect(BeaconProxyFactory.deploy(this.beacon, '0x', { value: '1' })).to.be.revertedWithCustomError(
        BeaconProxyFactory,
        'ERC1967NonPayable',
      );
    });

    it('reverting initialization function', async function () {
      const data = this.implementationV0.interface.encodeFunctionData('reverts');
      const BeaconProxyFactory = await ethers.getContractFactory('BeaconProxy');
      await expect(BeaconProxyFactory.deploy(this.beacon, data)).to.be.revertedWith('DummyImplementation reverted');
    });
  });

  describe('upgrade', async function () {
    it('upgrade a proxy by upgrading its beacon', async function () {
      const value = '10';
      const data = this.implementationV0.interface.encodeFunctionData('initializeNonPayableWithValue', [value]);
      const proxy = await ethers.deployContract(BeaconProxy, [this.beacon, data]);

      const dummy = await ethers.getContractAt(DummyImplementation, proxy);

      // test initial values
      expect(await dummy.value()).to.eq(value);

      // test initial version
      expect(await dummy.version()).to.eq('V1');

      // upgrade beacon
      await this.beacon.connect(this.upgradeableBeaconAdmin).upgradeTo(this.implementationV1);

      // test upgraded version
      expect(await dummy.version()).to.eq('V2');
    });

    it('upgrade 2 proxies by upgrading shared beacon', async function () {
      const value1 = '10';
      const value2 = '42';

      const proxy1InitializeData = this.implementationV0.interface.encodeFunctionData('initializeNonPayableWithValue', [
        value1,
      ]);
      const proxy1 = await ethers.deployContract(BeaconProxy, [this.beacon, proxy1InitializeData]);

      const proxy2InitializeData = this.implementationV0.interface.encodeFunctionData('initializeNonPayableWithValue', [
        value2,
      ]);
      const proxy2 = await ethers.deployContract(BeaconProxy, [this.beacon, proxy2InitializeData]);

      const dummy1 = await ethers.getContractAt(DummyImplementation, proxy1);
      const dummy2 = await ethers.getContractAt(DummyImplementation, proxy2);

      // test initial values
      expect(await dummy1.value()).to.eq(value1);
      expect(await dummy2.value()).to.eq(value2);

      // test initial version
      expect(await dummy1.version()).to.eq('V1');
      expect(await dummy2.version()).to.eq('V1');

      // upgrade beacon
      await this.beacon.connect(this.upgradeableBeaconAdmin).upgradeTo(this.implementationV1);

      // test upgraded version
      expect(await dummy1.version()).to.eq('V2');
      expect(await dummy2.version()).to.eq('V2');
    });
  });
});
