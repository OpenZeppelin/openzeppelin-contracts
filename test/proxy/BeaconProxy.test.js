const { BN, constants, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const ethereumjsUtil = require('ethereumjs-util');
const { keccak256 } = ethereumjsUtil;
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const BeaconProxy = artifacts.require('BeaconProxy');
const DummyImplementation = artifacts.require('DummyImplementation');
const DummyImplementationV2 = artifacts.require('DummyImplementationV2');
const Implementation1 = artifacts.require('Implementation1');
const Implementation2 = artifacts.require('Implementation2');
const Implementation3 = artifacts.require('Implementation3');
const Implementation4 = artifacts.require('Implementation4');

function toChecksumAddress(address) {
  return ethereumjsUtil.toChecksumAddress('0x' + address.replace(/^0x/, '').padStart(40, '0'));
}

function encodeCall (name, inputs, values) {
  return web3.eth.abi.encodeFunctionCall({ type: 'function', name, inputs }, values);
}

const sendTransaction = (target, method, args, values, opts) => {
  const data = encodeCall(method, args, values);
  return web3.eth.sendTransaction({ ...opts, to: target.address, data });
};

const BEACON_LABEL = 'eip1967.proxy.beacon';
const BEACON_SLOT = '0x' + new BN(keccak256(Buffer.from(BEACON_LABEL))).subn(1).toString(16);

contract('BeaconProxy', function (accounts) {
  const [proxyCreator, anotherAccount] = accounts;

  it('proxy cannot be initialized with a non-contract address', async function () {
    const nonContractAddress = proxyCreator;
    const initializeData = Buffer.from('');
    await expectRevert(
      BeaconProxy.new(nonContractAddress, initializeData, { from: proxyCreator }),
      'BeaconProxy: beacon is not a contract',
    );
  });

  before('deploy implementation', async function () {
    this.implementationV0 = await DummyImplementation.new();
    this.implementationV1 = await DummyImplementationV2.new();
  });

  describe('initialization', function () {
    before(function () {
      this.assertInitialized = async ({ value, balance }) => {
        const beaconAddress = toChecksumAddress(await web3.eth.getStorageAt(this.proxy.address, BEACON_SLOT));
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
      const data = this.implementationV0.contract.methods
        .initializeNonPayableWithValue(value)
        .encodeABI();
      this.proxy = await BeaconProxy.new(this.beacon.address, data);
      await this.assertInitialized({ value, balance: '0' });
    });

    it('payable initialization', async function () {
      const value = '55';
      const data = this.implementationV0.contract.methods
        .initializePayableWithValue(value)
        .encodeABI();
      const balance = '100';
      this.proxy = await BeaconProxy.new(this.beacon.address, data, { value: balance });
      await this.assertInitialized({ value, balance });
    });

    it('reverting initialization', async function () {
      const data = this.implementationV0.contract.methods.reverts().encodeABI();
      await expectRevert(
        BeaconProxy.new(this.beacon.address, data),
        'DummyImplementation reverted',
      );
    });
  });

  describe('upgrades', function () {
    beforeEach(async function () {
      const initializeData = Buffer.from('');
      this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
      this.proxy = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });
    });

    describe('implementation', function () {
      it('returns the current implementation address', async function () {
        const implementation = await this.beacon.implementation();
        expect(implementation).to.be.equal(this.implementationV0.address);
      });

      it('delegates to the implementation', async function () {
        const dummy = new DummyImplementation(this.proxy.address);
        const value = await dummy.get();

        expect(value).to.equal(true);
      });
    });

    describe('storage', function () {
      it('should store the implementation address in specified location', async function () {
        const implementation = await this.beacon.implementation();
        expect(implementation).to.be.equal(this.implementationV0.address);
      });
    });

    describe('regression', () => {
      const initializeData = Buffer.from('');

      it('should add new function', async () => {
        const instance1 = await Implementation1.new();
        this.beacon = await UpgradeableBeacon.new(instance1.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance1 = new Implementation1(proxy.address);
        await proxyInstance1.setValue(42);

        const instance2 = await Implementation2.new();
        await this.beacon.upgradeTo(instance2.address, { from: proxyCreator });

        const proxyInstance2 = new Implementation2(proxy.address);
        const res = await proxyInstance2.getValue();
        expect(res).to.bignumber.eq('42');
      });

      it('should remove function', async () => {
        const instance2 = await Implementation2.new();
        this.beacon = await UpgradeableBeacon.new(instance2.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance2 = new Implementation2(proxy.address);
        await proxyInstance2.setValue(42);
        const res = await proxyInstance2.getValue();
        expect(res).to.bignumber.eq('42');

        const instance1 = await Implementation1.new();
        await this.beacon.upgradeTo(instance1.address, { from: proxyCreator });

        const proxyInstance1 = new Implementation2(proxy.address);
        await expectRevert.unspecified(proxyInstance1.getValue());
      });

      it('should change function signature', async () => {
        const instance1 = await Implementation1.new();
        this.beacon = await UpgradeableBeacon.new(instance1.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance1 = new Implementation1(proxy.address);
        await proxyInstance1.setValue(42);

        const instance3 = await Implementation3.new();
        await this.beacon.upgradeTo(instance3.address, { from: proxyCreator });
        const proxyInstance3 = new Implementation3(proxy.address);

        const res = await proxyInstance3.getValue(8);
        expect(res).to.bignumber.eq('50');
      });

      it('should add fallback function', async () => {
        const initializeData = Buffer.from('');
        const instance1 = await Implementation1.new();
        this.beacon = await UpgradeableBeacon.new(instance1.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        const instance4 = await Implementation4.new();
        await this.beacon.upgradeTo(instance4.address, { from: proxyCreator });
        const proxyInstance4 = new Implementation4(proxy.address);

        await sendTransaction(proxy, '', [], [], { from: anotherAccount });

        const res = await proxyInstance4.getValue();
        expect(res).to.bignumber.eq('1');
      });

      it('should remove fallback function', async () => {
        const instance4 = await Implementation4.new();
        this.beacon = await UpgradeableBeacon.new(instance4.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        const instance2 = await Implementation2.new();
        await this.beacon.upgradeTo(instance2.address, { from: proxyCreator });

        await expectRevert.unspecified(
          sendTransaction(proxy, '', [], [], { from: anotherAccount }),
        );

        const proxyInstance2 = new Implementation2(proxy.address);
        const res = await proxyInstance2.getValue();
        expect(res).to.bignumber.eq('0');
      });
    });
  });

  it('one beacon shared by two proxies', async function () {
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
