'use strict';

require('../../setup');

import BeaconProxy from '../../../src/proxy/BeaconProxy';
import Beacon from '../../../src/proxy/Beacon';
import ZWeb3 from '../../../src/artifacts/ZWeb3';
import encodeCall from '../../../src/helpers/encodeCall';
import assertRevert from '../../../src/test/helpers/assertRevert';
import Contracts from '../../../src/artifacts/Contracts';
import utils from 'web3-utils';
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const Implementation1 = Contracts.getFromLocal('Implementation1');
const Implementation2 = Contracts.getFromLocal('Implementation2');
const Implementation3 = Contracts.getFromLocal('Implementation3');
const Implementation4 = Contracts.getFromLocal('Implementation4');

const sendTransaction = (target, method, args, values, opts) => {
  const data = encodeCall(method, args, values);
  return ZWeb3.eth.sendTransaction({ ...opts, to: target.address, data });
};

export default function shouldBehaveLikeUpgradeabilityBeaconProxy(createBeacon, createProxy, accounts) {
  const [proxyCreator, anotherAccount] = accounts;

  it('Beacon cannot be initialized with a non-contract address', async function() {
    const nonContractAddress = proxyCreator;
    await assertRevert(
      createBeacon(nonContractAddress, {
        from: proxyCreator,
      }),
    );
  });

  it('Proxy cannot be initialized with a non-contract address', async function() {
    const nonContractAddress = proxyCreator;
    const initializeData = Buffer.from('');
    await assertRevert(
      createProxy(nonContractAddress, initializeData, {
        from: proxyCreator,
      }),
    );
  });

  before('deploy implementation', async function() {
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.implementation_v0 = utils.toChecksumAddress((await DummyImplementation.new()).address);
    // eslint-disable-next-line @typescript-eslint/camelcase
    this.implementation_v1 = utils.toChecksumAddress((await DummyImplementation.new()).address);
  });

  const assertProxyInitialization = function({ value, balance }) {
    it('sets the implementation address', async function() {
      const beacon = await BeaconProxy.at(this.proxy).beacon();
      const implementation = await Beacon.at(beacon).implementation();
      implementation.should.be.equal(this.implementation_v0);
    });

    it('initializes the proxy', async function() {
      const dummy = await DummyImplementation.at(this.proxy);
      (await dummy.methods.value().call()).should.eq(value.toString());
    });

    it('has expected balance', async function() {
      (await ZWeb3.eth.getBalance(this.proxy)).should.eq(balance.toString());
    });
  };

  describe('without initialization', function() {
    const initializeData = Buffer.from('');

    describe('when not sending balance', function() {
      beforeEach('creating proxy', async function() {
        const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
        this.proxy = (
          await createProxy(beacon.address, initializeData, {
            from: proxyCreator,
          })
        ).address;
      });

      assertProxyInitialization({ value: 0, balance: 0 });
    });

    describe('when sending some balance', function() {
      const value = 10e5;

      beforeEach('creating proxy', async function() {
        const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
        this.proxy = (
          await createProxy(beacon.address, initializeData, {
            from: proxyCreator,
            value,
          })
        ).address;
      });

      assertProxyInitialization({ value: 0, balance: value });
    });
  });

  describe('initialization without parameters', function() {
    describe('non payable', function() {
      const expectedInitializedValue = 10;
      const initializeData = encodeCall('initializeNonPayable', [], []);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          this.proxy = (
            await createProxy(beacon.address, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        it('reverts', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          await assertRevert(createProxy(beacon.address, initializeData, { from: proxyCreator, value }));
        });
      });
    });

    describe('payable', function() {
      const expectedInitializedValue = 100;
      const initializeData = encodeCall('initializePayable', [], []);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          this.proxy = (
            await createProxy(beacon.address, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        beforeEach('creating proxy', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          this.proxy = (
            await createProxy(beacon.address, initializeData, {
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

  describe('initialization with parameters', function() {
    describe('non payable', function() {
      const expectedInitializedValue = 10;
      const initializeData = encodeCall('initializeNonPayable', ['uint256'], [expectedInitializedValue]);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          this.proxy = (
            await createProxy(beacon.address, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        it('reverts', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          await assertRevert(createProxy(beacon.address, initializeData, { from: proxyCreator, value }));
        });
      });
    });

    describe('payable', function() {
      const expectedInitializedValue = 42;
      const initializeData = encodeCall('initializePayable', ['uint256'], [expectedInitializedValue]);

      describe('when not sending balance', function() {
        beforeEach('creating proxy', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          this.proxy = (
            await createProxy(beacon.address, initializeData, {
              from: proxyCreator,
            })
          ).address;
        });

        assertProxyInitialization({
          value: expectedInitializedValue,
          balance: 0,
        });
      });

      describe('when sending some balance', function() {
        const value = 10e5;

        beforeEach('creating proxy', async function() {
          const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
          this.proxy = (
            await createProxy(beacon.address, initializeData, {
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

  describe('upgrades', function() {
    beforeEach(async function() {
      const initializeData = Buffer.from('');
      const beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
      this.proxy = await createProxy(beacon.address, initializeData, {
        from: proxyCreator,
      });
    });

    describe('implementation', function() {
      it('returns the current implementation address', async function() {
        const beacon = Beacon.at(await BeaconProxy.at(this.proxy.address).beacon());
        const implementation = await beacon.implementation();
        implementation.should.be.equal(this.implementation_v0);
      });

      it('delegates to the implementation', async function() {
        const dummy = await DummyImplementation.at(this.proxy.address);
        const value = await dummy.methods.get().call();

        value.should.be.true;
      });
    });

    describe('upgrade', function() {
      describe('when the sender is the admin', function() {
        const from = proxyCreator;

        describe('when the given implementation is different from the current one', function() {
          it('upgrades to the requested implementation', async function() {
            const beacon = Beacon.at(await BeaconProxy.at(this.proxy.address).beacon(), { from });
            await beacon.upgradeTo(this.implementation_v1);

            const implementation = await beacon.implementation();
            implementation.should.be.equal(this.implementation_v1);
          });

          it('emits an event', async function() {
            const beacon = Beacon.at(await BeaconProxy.at(this.proxy.address).beacon(), { from });
            const { events } = await beacon.upgradeTo(this.implementation_v1);
            events.should.have.key('Upgraded');
            events['Upgraded'].returnValues.implementation.should.be.equal(this.implementation_v1);
          });
        });

        describe('when the given implementation is the zero address', function() {
          it('reverts', async function() {
            const beacon = Beacon.at(await BeaconProxy.at(this.proxy.address).beacon(), { from });
            await assertRevert(beacon.upgradeTo(ZERO_ADDRESS));
          });
        });
      });

      describe('when the sender is not the admin', function() {
        const from = anotherAccount;

        it('reverts', async function() {
          const beacon = Beacon.at(await BeaconProxy.at(this.proxy.address).beacon(), { from });
          await assertRevert(beacon.upgradeTo(this.implementation_v1));
        });
      });
    });

    describe('storage', function() {
      it('should store the implementation address in specified location', async function() {
        const beacon = Beacon.at(await BeaconProxy.at(this.proxy.address).beacon());
        const implementation = await beacon.implementation();
        implementation.should.be.equalIgnoreCase(this.implementation_v0);
      });
    });

    describe('regression', () => {
      const initializeData = Buffer.from('');

      it('should add new function', async () => {
        const instance1 = await Implementation1.new();
        const beacon = await createBeacon(instance1.address, { from: proxyCreator });
        const proxy = await createProxy(beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance1 = await Implementation1.at(proxy.address);
        await proxyInstance1.methods.setValue(42).send();

        const instance2 = await Implementation2.new();
        const beaconContract = Beacon.at(await BeaconProxy.at(proxy.address).beacon(), { from: proxyCreator });
        await beaconContract.upgradeTo(instance2.address);

        const proxyInstance2 = await Implementation2.at(proxy.address);
        const res = await proxyInstance2.methods.getValue().call();
        res.toString().should.eq('42');
      });

      it('should remove function', async () => {
        const instance2 = await Implementation2.new();
        const beacon = await createBeacon(instance2.address, { from: proxyCreator });
        const proxy = await createProxy(beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance2 = await Implementation2.at(proxy.address);
        await proxyInstance2.methods.setValue(42).send();
        const res = await proxyInstance2.methods.getValue().call();
        res.toString().should.eq('42');

        const instance1 = await Implementation1.new();
        const beaconContract = Beacon.at(await BeaconProxy.at(proxy.address).beacon(), { from: proxyCreator });
        await beaconContract.upgradeTo(instance1.address);

        const proxyInstance1 = await Implementation2.at(proxy.address);
        await assertRevert(proxyInstance1.methods.getValue().call());
      });

      it('should change function signature', async () => {
        const instance1 = await Implementation1.new();
        const beacon = await createBeacon(instance1.address, { from: proxyCreator });
        const proxy = await createProxy(beacon.address, initializeData, { from: proxyCreator });

        const proxyInstance1 = await Implementation1.at(proxy.address);
        await proxyInstance1.methods.setValue(42).send();

        const instance3 = await Implementation3.new();
        const beaconContract = Beacon.at(await BeaconProxy.at(proxy.address).beacon(), { from: proxyCreator });
        await beaconContract.upgradeTo(instance3.address);
        const proxyInstance3 = Implementation3.at(proxy.address);

        const res = await proxyInstance3.methods.getValue(8).call();
        res.toString().should.eq('50');
      });

      it('should add fallback function', async () => {
        const initializeData = Buffer.from('');
        const instance1 = await Implementation1.new();
        const beacon = await createBeacon(instance1.address, { from: proxyCreator });
        const proxy = await createProxy(beacon.address, initializeData, { from: proxyCreator });

        const instance4 = await Implementation4.new();
        const beaconContract = Beacon.at(await BeaconProxy.at(proxy.address).beacon(), { from: proxyCreator });
        await beaconContract.upgradeTo(instance4.address);
        const proxyInstance4 = await Implementation4.at(proxy.address);

        await sendTransaction(proxy, '', [], [], { from: anotherAccount });

        const res = await proxyInstance4.methods.getValue().call();
        res.toString().should.eq('1');
      });

      it('should remove fallback function', async () => {
        const instance4 = await Implementation4.new();
        const beacon = await createBeacon(instance4.address, { from: proxyCreator });
        const proxy = await createProxy(beacon.address, initializeData, { from: proxyCreator });

        const instance2 = await Implementation2.new();
        const beaconContract = Beacon.at(await BeaconProxy.at(proxy.address).beacon(), { from: proxyCreator });
        await beaconContract.upgradeTo(instance2.address);

        await assertRevert(sendTransaction(proxy, '', [], [], { from: anotherAccount }));

        const proxyInstance2 = await Implementation2.at(proxy.address);
        const res = await proxyInstance2.methods.getValue().call();
        res.toString().should.eq('0');
      });
    });
  });

  describe('one beacon for many proxies', function() {
    describe('initialize', function() {
      const proxy1ExpectedInitializedValue = 10;
      const proxy2ExpectedInitializedValue = 42;

      beforeEach(async function() {
        this.beacon = await createBeacon(this.implementation_v0, { from: proxyCreator });
        const proxy1InitializeData = encodeCall('initializeNonPayable', ['uint256'], [proxy1ExpectedInitializedValue]);
        this.proxy1 = await createProxy(this.beacon.address, proxy1InitializeData, {
          from: proxyCreator,
        });
        const proxy2InitializeData = encodeCall('initializeNonPayable', ['uint256'], [proxy2ExpectedInitializedValue]);
        this.proxy2 = await createProxy(this.beacon.address, proxy2InitializeData, {
          from: proxyCreator,
        });
      });

      it('initializes the proxy1', async function() {
        const dummy = await DummyImplementation.at(this.proxy1.address);
        (await dummy.methods.value().call()).should.eq(proxy1ExpectedInitializedValue.toString());
      });

      it('initializes the proxy2 with a different value', async function() {
        const dummy = await DummyImplementation.at(this.proxy2.address);
        (await dummy.methods.value().call()).should.eq(proxy2ExpectedInitializedValue.toString());
      });
    });

    describe('upgrade', function() {
      beforeEach(async function() {
        const instance2 = await Implementation2.new();
        this.beacon = await createBeacon(instance2.address, { from: proxyCreator });
        const initializeData = Buffer.from('');
        this.proxy1 = await createProxy(this.beacon.address, initializeData, { from: proxyCreator });
        this.proxy2 = await createProxy(this.beacon.address, initializeData, { from: proxyCreator });

        this.instance3 = await Implementation3.new();
        const beacon = Beacon.at(this.beacon.address, { from: proxyCreator });
        await beacon.upgradeTo(this.instance3.address);
      });

      it('Beacon has the correct implementation', async function() {
        const implementation = await this.beacon.methods.implementation().call();
        implementation.should.be.equal(this.instance3.address);
      });

      it('should remove function from proxy 1', async function() {
        const instance2 = await Implementation2.at(this.proxy1.address);
        await assertRevert(instance2.methods.getValue().call());
      });

      it('should remove function from proxy 2', async function() {
        const instance2 = await Implementation2.at(this.proxy2.address);
        await assertRevert(instance2.methods.getValue().call());
      });
    });
  });
}
