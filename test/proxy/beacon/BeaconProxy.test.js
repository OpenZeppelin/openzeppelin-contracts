const { expectRevert } = require('@openzeppelin/test-helpers');
const { getSlot, BeaconSlot } = require('../../helpers/erc1967');

const { expect } = require('chai');

const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const BeaconProxy = artifacts.require('BeaconProxy');
const DummyImplementation = artifacts.require('DummyImplementation');
const DummyImplementationV2 = artifacts.require('DummyImplementationV2');
const BadBeaconNoImpl = artifacts.require('BadBeaconNoImpl');
const BadBeaconNotContract = artifacts.require('BadBeaconNotContract');

contract('BeaconProxy', function (accounts) {
  const [anotherAccount] = accounts;

  describe('bad beacon is not accepted', async function () {
    it('non-contract beacon', async function () {
      await expectRevert(BeaconProxy.new(anotherAccount, '0x'), 'ERC1967: new beacon is not a contract');
    });

    it('non-compliant beacon', async function () {
      const beacon = await BadBeaconNoImpl.new();
      await expectRevert.unspecified(BeaconProxy.new(beacon.address, '0x'));
    });

    it('non-contract implementation', async function () {
      const beacon = await BadBeaconNotContract.new();
      await expectRevert(BeaconProxy.new(beacon.address, '0x'), 'ERC1967: beacon implementation is not a contract');
    });
  });

  before('deploy implementation', async function () {
    this.implementationV0 = await DummyImplementation.new();
    this.implementationV1 = await DummyImplementationV2.new();
  });

  describe('initialization', function () {
    before(function () {
      this.assertInitialized = async ({ value, balance }) => {
        const beaconSlot = await getSlot(this.proxy, BeaconSlot);
        const beaconAddress = web3.utils.toChecksumAddress(beaconSlot.substr(-40));
        expect(beaconAddress).to.equal(this.beacon.address);

        const dummy = new DummyImplementation(this.proxy.address);
        expect(await dummy.value()).to.bignumber.eq(value);

        expect(await web3.eth.getBalance(this.proxy.address)).to.bignumber.eq(balance);
      };
    });

    beforeEach('deploy beacon', async function () {
      this.beacon = await UpgradeableBeacon.new(this.implementationV0.address);
    });

    it('no initialization', async function () {
      const data = Buffer.from('');
      const balance = '10';
      this.proxy = await BeaconProxy.new(this.beacon.address, data, { value: balance });
      await this.assertInitialized({ value: '0', balance });
    });

    it('non-payable initialization', async function () {
      const value = '55';
      const data = this.implementationV0.contract.methods.initializeNonPayableWithValue(value).encodeABI();
      this.proxy = await BeaconProxy.new(this.beacon.address, data);
      await this.assertInitialized({ value, balance: '0' });
    });

    it('payable initialization', async function () {
      const value = '55';
      const data = this.implementationV0.contract.methods.initializePayableWithValue(value).encodeABI();
      const balance = '100';
      this.proxy = await BeaconProxy.new(this.beacon.address, data, { value: balance });
      await this.assertInitialized({ value, balance });
    });

    it('reverting initialization', async function () {
      const data = this.implementationV0.contract.methods.reverts().encodeABI();
      await expectRevert(BeaconProxy.new(this.beacon.address, data), 'DummyImplementation reverted');
    });
  });

  it('upgrade a proxy by upgrading its beacon', async function () {
    const beacon = await UpgradeableBeacon.new(this.implementationV0.address);

    const value = '10';
    const data = this.implementationV0.contract.methods.initializeNonPayableWithValue(value).encodeABI();
    const proxy = await BeaconProxy.new(beacon.address, data);

    const dummy = new DummyImplementation(proxy.address);

    // test initial values
    expect(await dummy.value()).to.bignumber.eq(value);

    // test initial version
    expect(await dummy.version()).to.eq('V1');

    // upgrade beacon
    await beacon.upgradeTo(this.implementationV1.address);

    // test upgraded version
    expect(await dummy.version()).to.eq('V2');
  });

  it('upgrade 2 proxies by upgrading shared beacon', async function () {
    const value1 = '10';
    const value2 = '42';

    const beacon = await UpgradeableBeacon.new(this.implementationV0.address);

    const proxy1InitializeData = this.implementationV0.contract.methods
      .initializeNonPayableWithValue(value1)
      .encodeABI();
    const proxy1 = await BeaconProxy.new(beacon.address, proxy1InitializeData);

    const proxy2InitializeData = this.implementationV0.contract.methods
      .initializeNonPayableWithValue(value2)
      .encodeABI();
    const proxy2 = await BeaconProxy.new(beacon.address, proxy2InitializeData);

    const dummy1 = new DummyImplementation(proxy1.address);
    const dummy2 = new DummyImplementation(proxy2.address);

    // test initial values
    expect(await dummy1.value()).to.bignumber.eq(value1);
    expect(await dummy2.value()).to.bignumber.eq(value2);

    // test initial version
    expect(await dummy1.version()).to.eq('V1');
    expect(await dummy2.version()).to.eq('V1');

    // upgrade beacon
    await beacon.upgradeTo(this.implementationV1.address);

    // test upgraded version
    expect(await dummy1.version()).to.eq('V2');
    expect(await dummy2.version()).to.eq('V2');
  });
});
