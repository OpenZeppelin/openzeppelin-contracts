const { BN, constants, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { toChecksumAddress, keccak256 } = require('ethereumjs-util');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const BeaconProxy = artifacts.require('BeaconProxy');
const DummyImplementation = artifacts.require('DummyImplementation');
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
    this.implementationV1 = await DummyImplementation.new();
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

  describe('one this.beacon for many proxies', function () {
    describe('initialize', function () {
      const proxy1ExpectedInitializedValue = '10';
      const proxy2ExpectedInitializedValue = '42';

      beforeEach(async function () {
        this.beacon = await UpgradeableBeacon.new(this.implementationV0.address, { from: proxyCreator });
        const proxy1InitializeData = this.implementationV0.contract.methods
          .initializeNonPayableWithValue(proxy1ExpectedInitializedValue)
          .encodeABI();
        this.proxy1 = await BeaconProxy.new(this.beacon.address, proxy1InitializeData, { from: proxyCreator });
        const proxy2InitializeData = this.implementationV0.contract.methods
          .initializeNonPayableWithValue(proxy2ExpectedInitializedValue)
          .encodeABI();
        this.proxy2 = await BeaconProxy.new(this.beacon.address, proxy2InitializeData, { from: proxyCreator });
      });

      it('initializes the proxy1', async function () {
        const dummy = new DummyImplementation(this.proxy1.address);
        expect(await dummy.value()).to.bignumber.eq(proxy1ExpectedInitializedValue);
      });

      it('initializes the proxy2 with a different value', async function () {
        const dummy = new DummyImplementation(this.proxy2.address);
        expect(await dummy.value()).to.bignumber.eq(proxy2ExpectedInitializedValue);
      });
    });

    describe('upgrade', function () {
      beforeEach(async function () {
        const instance2 = await Implementation2.new();
        this.beacon = await UpgradeableBeacon.new(instance2.address, { from: proxyCreator });
        const initializeData = Buffer.from('');
        this.proxy1 = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });
        this.proxy2 = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        this.instance3 = await Implementation3.new();
        await this.beacon.upgradeTo(this.instance3.address, { from: proxyCreator });
      });

      it('UpgradeableBeacon has the correct implementation', async function () {
        const implementation = await this.beacon.implementation();
        expect(implementation).to.be.equal(this.instance3.address);
      });

      it('should remove function from proxy 1', async function () {
        const instance2 = new Implementation2(this.proxy1.address);
        await expectRevert.unspecified(instance2.getValue());
      });

      it('should remove function from proxy 2', async function () {
        const instance2 = new Implementation2(this.proxy2.address);
        await expectRevert.unspecified(instance2.getValue());
      });

      it('should succeed with an available function', async function () {
        const instance3 = new Implementation3(this.proxy2.address);
        const value = await instance3.getValue('3');
        expect(value).to.bignumber.equal('3');
      });
    });
  });
});
