const { BN, constants, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { toChecksumAddress, keccak256 } = require('ethereumjs-util');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Beacon = artifacts.require('Beacon');
const BeaconProxy = artifacts.require('BeaconUpgradeableProxy');
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

const slot = '0x' + new BN(keccak256(Buffer.from(BEACON_LABEL))).subn(1).toString(16);

async function getBeacon (proxyAddress) {
  return toChecksumAddress(await web3.eth.getStorageAt(proxyAddress, slot));
}

contract('BeaconUpgradeableProxy', function (accounts) {
  const [proxyCreator, anotherAccount] = accounts;

  it('beacon cannot be initialized with a non-contract address', async function () {
    const nonContractAddress = proxyCreator;
    await expectRevert(
      Beacon.new(nonContractAddress, { from: proxyCreator }),
      'Beacon: implementation is not a contract',
    );
  });

  it('proxy cannot be initialized with a non-contract address', async function () {
    const nonContractAddress = proxyCreator;
    const initializeData = Buffer.from('');
    await expectRevert(
      BeaconProxy.new(nonContractAddress, initializeData, { from: proxyCreator }),
      'BeaconUpgradeableProxy: beacon is not a contract',
    );
  });

  before('deploy implementation', async function () {
    this.implementationV0 = await DummyImplementation.new();
    this.implementationV1 = await DummyImplementation.new();
  });

  const assertProxyInitialization = function ({ value, balance }) {
    it('sets the implementation address', async function () {
      const beacon = await getBeacon(this.proxy);
      const implementation = await new Beacon(beacon).implementation();
      expect(implementation).to.be.equal(this.implementationV0.address);
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
        const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
        this.proxy = (
          await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator })
        ).address;
      });

      assertProxyInitialization({ value: '0', balance: '0' });
    });

    describe('when sending some balance', function () {
      const value = 10e5.toString();

      beforeEach('creating proxy', async function () {
        const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
        this.proxy = (
          await BeaconProxy.new(beacon.address, initializeData, {
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(beacon.address, this.initializeData, { from: proxyCreator })
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          await expectRevert(
            BeaconProxy.new(beacon.address, this.initializeData, { value, from: proxyCreator }),
            'BeaconUpgradeableProxy: function call failed',
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(beacon.address, this.initializeData, { from: proxyCreator })
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(beacon.address, this.initializeData, {
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(beacon.address, this.initializeData, { from: proxyCreator })
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          await expectRevert(
            BeaconProxy.new(beacon.address, this.initializeData, { from: proxyCreator, value }),
            'BeaconUpgradeableProxy: function call failed',
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(beacon.address, this.initializeData, { from: proxyCreator })
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
          const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
          this.proxy = (
            await BeaconProxy.new(beacon.address, this.initializeData, {
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
      const beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
      this.proxy = await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator });
    });

    describe('implementation', function () {
      it('returns the current implementation address', async function () {
        const beacon = new Beacon(await getBeacon(this.proxy.address));
        const implementation = await beacon.implementation();
        expect(implementation).to.be.equal(this.implementationV0.address);
      });

      it('delegates to the implementation', async function () {
        const dummy = await new DummyImplementation(this.proxy.address);
        const value = await dummy.get();

        expect(value).to.equal(true);
      });
    });

    describe('upgrade', function () {
      describe('when the sender is the admin', function () {
        const from = proxyCreator;

        describe('when the given implementation is different from the current one', function () {
          it('upgrades to the requested implementation', async function () {
            const beacon = new Beacon(await getBeacon(this.proxy.address));
            await beacon.upgradeTo(this.implementationV1.address, { from });

            const implementation = await beacon.implementation();
            expect(implementation).to.be.equal(this.implementationV1.address);
          });

          it('emits an event', async function () {
            const beacon = new Beacon(await getBeacon(this.proxy.address));
            expectEvent(
              await beacon.upgradeTo(this.implementationV1.address, { from }),
              'Upgraded',
              { implementation: this.implementationV1.address },
            );
          });
        });

        describe('when the given implementation is the zero address', function () {
          it('reverts', async function () {
            const beacon = new Beacon(await getBeacon(this.proxy.address));
            await expectRevert(
              beacon.upgradeTo(ZERO_ADDRESS, { from }),
              'Beacon: implementation is not a contract',
            );
          });
        });
      });

      describe('when the sender is not the admin', function () {
        const from = anotherAccount;

        it('reverts', async function () {
          const beacon = new Beacon(await getBeacon(this.proxy.address));
          await expectRevert(
            beacon.upgradeTo(this.implementationV1.address, { from }),
            'Ownable: caller is not the owner',
          );
        });
      });
    });

    describe('storage', function () {
      it('should store the implementation address in specified location', async function () {
        const beacon = new Beacon(await getBeacon(this.proxy.address));
        const implementation = await beacon.implementation();
        expect(implementation).to.be.equal(this.implementationV0.address);
      });
    });

    describe('regression', () => {
      const initializeData = Buffer.from('');

      it('should add new function', async () => {
        const instance1 = await Implementation1.new();
        const beacon = await Beacon.new(instance1.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance1 = await new Implementation1(proxy.address);
        await proxyInstance1.setValue(42);

        const instance2 = await Implementation2.new();
        const beaconContract = new Beacon(await getBeacon(proxy.address));
        await beaconContract.upgradeTo(instance2.address, { from: proxyCreator });

        const proxyInstance2 = await new Implementation2(proxy.address);
        const res = await proxyInstance2.getValue();
        expect(res).to.bignumber.eq('42');
      });

      it('should remove function', async () => {
        const instance2 = await Implementation2.new();
        const beacon = await Beacon.new(instance2.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance2 = await new Implementation2(proxy.address);
        await proxyInstance2.setValue(42);
        const res = await proxyInstance2.getValue();
        expect(res).to.bignumber.eq('42');

        const instance1 = await Implementation1.new();
        const beaconContract = new Beacon(await getBeacon(proxy.address));
        await beaconContract.upgradeTo(instance1.address, { from: proxyCreator });

        const proxyInstance1 = await new Implementation2(proxy.address);
        await expectRevert(proxyInstance1.getValue(), 'function selector was not recognized');
      });

      it('should change function signature', async () => {
        const instance1 = await Implementation1.new();
        const beacon = await Beacon.new(instance1.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance1 = await new Implementation1(proxy.address);
        await proxyInstance1.setValue(42);

        const instance3 = await Implementation3.new();
        const beaconContract = new Beacon(await getBeacon(proxy.address));
        await beaconContract.upgradeTo(instance3.address, { from: proxyCreator });
        const proxyInstance3 = new Implementation3(proxy.address);

        const res = await proxyInstance3.getValue(8);
        expect(res).to.bignumber.eq('50');
      });

      it('should add fallback function', async () => {
        const initializeData = Buffer.from('');
        const instance1 = await Implementation1.new();
        const beacon = await Beacon.new(instance1.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator });

        const instance4 = await Implementation4.new();
        const beaconContract = new Beacon(await getBeacon(proxy.address));
        await beaconContract.upgradeTo(instance4.address, { from: proxyCreator });
        const proxyInstance4 = await new Implementation4(proxy.address);

        await sendTransaction(proxy, '', [], [], { from: anotherAccount });

        const res = await proxyInstance4.getValue();
        expect(res).to.bignumber.eq('1');
      });

      it('should remove fallback function', async () => {
        const instance4 = await Implementation4.new();
        const beacon = await Beacon.new(instance4.address, { from: proxyCreator });
        const proxy = await BeaconProxy.new(beacon.address, initializeData, { from: proxyCreator });

        const instance2 = await Implementation2.new();
        const beaconContract = new Beacon(await getBeacon(proxy.address));
        await beaconContract.upgradeTo(instance2.address, { from: proxyCreator });

        await expectRevert(
          sendTransaction(proxy, '', [], [], { from: anotherAccount }),
          'there\'s no fallback function',
        );

        const proxyInstance2 = await new Implementation2(proxy.address);
        const res = await proxyInstance2.getValue();
        expect(res).to.bignumber.eq('0');
      });
    });
  });

  describe('one beacon for many proxies', function () {
    describe('initialize', function () {
      const proxy1ExpectedInitializedValue = '10';
      const proxy2ExpectedInitializedValue = '42';

      beforeEach(async function () {
        this.beacon = await Beacon.new(this.implementationV0.address, { from: proxyCreator });
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
        const dummy = await new DummyImplementation(this.proxy1.address);
        expect(await dummy.value()).to.bignumber.eq(proxy1ExpectedInitializedValue);
      });

      it('initializes the proxy2 with a different value', async function () {
        const dummy = await new DummyImplementation(this.proxy2.address);
        expect(await dummy.value()).to.bignumber.eq(proxy2ExpectedInitializedValue);
      });
    });

    describe('upgrade', function () {
      beforeEach(async function () {
        const instance2 = await Implementation2.new();
        this.beacon = await Beacon.new(instance2.address, { from: proxyCreator });
        const initializeData = Buffer.from('');
        this.proxy1 = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });
        this.proxy2 = await BeaconProxy.new(this.beacon.address, initializeData, { from: proxyCreator });

        this.instance3 = await Implementation3.new();
        const beacon = new Beacon(this.beacon.address);
        await beacon.upgradeTo(this.instance3.address, { from: proxyCreator });
      });

      it('Beacon has the correct implementation', async function () {
        const implementation = await this.beacon.implementation();
        expect(implementation).to.be.equal(this.instance3.address);
      });

      it('should remove function from proxy 1', async function () {
        const instance2 = await new Implementation2(this.proxy1.address);
        await expectRevert(instance2.getValue(), 'function selector was not recognized');
      });

      it('should remove function from proxy 2', async function () {
        const instance2 = await new Implementation2(this.proxy2.address);
        await expectRevert(instance2.getValue(), 'function selector was not recognized');
      });
    });
  });
});
