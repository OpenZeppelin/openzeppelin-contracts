const { BN, constants, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { toChecksumAddress, keccak256 } = require('ethereumjs-util');
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

  const assertProxyInitialization = function ({ value, balance }) {
    it('sets the proxy beacon', async function () {
      const beaconAddress = toChecksumAddress(await web3.eth.getStorageAt(this.proxy, BEACON_SLOT));
      expect(beaconAddress).to.equal(this.beacon.address);
    });

    it('initializes the proxy', async function () {
      const dummy = new DummyImplementation(this.proxy);
      expect(await dummy.value()).to.bignumber.eq(value);
    });

    it('has expected balance', async function () {
      expect(await web3.eth.getBalance(this.proxy)).to.bignumber.eq(balance);
    });
  };

  describe('without initialization', function () {
    const initializeData = Buffer.from('');

    describe('when not sending balance', function () {
      beforeEach('creating proxy', async function () {
        this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
        this.proxy = (
          await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator })
        ).address;
      });

      assertProxyInitialization({ value: '0', balance: '0' });
    });

    describe('when sending some balance', function () {
      const value = 10e5.toString();

      beforeEach('creating proxy', async function () {
        this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
        this.proxy = (
          await BeaconProxy.new(this.beacon.address, initializeData, {
            from: proxyCreator,
            value,
          })
        ).address;
      });

      assertProxyInitialization({ value: '0', balance: value });
    });
  });

  describe('initialization without parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = '10';

      beforeEach(function () {
        this.initializeData = this.implementationV0.contract.methods
          .initializeNonPayable()
          .encodeABI();
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(this.beacon.address, this.initializeData, { from: proxyCreator })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: '0',
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5.toString();

        it('reverts', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          await expectRevert(
            BeaconProxy.new(this.beacon.address, this.initializeData, { value, from: proxyCreator }),
            'BeaconProxy: function call failed',
          );
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = '100';

      beforeEach(function () {
        this.initializeData = this.implementationV0.contract.methods
          .initializePayable()
          .encodeABI();
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(this.beacon.address, this.initializeData, { from: proxyCreator })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: '0',
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5.toString();

        beforeEach('creating proxy', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(this.beacon.address, this.initializeData, {
              from: proxyCreator,
              value,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
    });
  });

  describe('initialization with parameters', function () {
    describe('non payable', function () {
      const expectedInitializedValue = '10';

      beforeEach(function () {
        this.initializeData = this.implementationV0.contract.methods
          .initializeNonPayableWithValue(expectedInitializedValue)
          .encodeABI();
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(this.beacon.address, this.initializeData, { from: proxyCreator })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: '0',
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5.toString();

        it('reverts', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          await expectRevert(
            BeaconProxy.new(this.beacon.address, this.initializeData, { from: proxyCreator, value }),
            'BeaconProxy: function call failed',
          );
        });
      });
    });

    describe('payable', function () {
      const expectedInitializedValue = '42';

      beforeEach(function () {
        this.initializeData = this.implementationV0.contract.methods
          .initializePayableWithValue(expectedInitializedValue)
          .encodeABI();
      });

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(this.beacon.address, this.initializeData, { from: proxyCreator })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: '0',
        });
      });

      describe('when sending some balance', function () {
        const value = 10e5.toString();

        beforeEach('creating proxy', async function () {
          this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(this.beacon.address, this.initializeData, {
              from: proxyCreator,
              value,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: value,
        });
      });
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
