const { BN, expectRevert, expectEvent, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { getAddressInSlot, ImplementationSlot, AdminSlot } = require('../../helpers/erc1967');
const { expectRevertCustomError } = require('../../helpers/customError');

const { expect } = require('chai');
const { web3 } = require('hardhat');
const { computeCreateAddress } = require('../../helpers/create');
const { impersonate } = require('../../helpers/account');

const Implementation1 = artifacts.require('Implementation1');
const Implementation2 = artifacts.require('Implementation2');
const Implementation3 = artifacts.require('Implementation3');
const Implementation4 = artifacts.require('Implementation4');
const MigratableMockV1 = artifacts.require('MigratableMockV1');
const MigratableMockV2 = artifacts.require('MigratableMockV2');
const MigratableMockV3 = artifacts.require('MigratableMockV3');
const InitializableMock = artifacts.require('InitializableMock');
const DummyImplementation = artifacts.require('DummyImplementation');
const ClashingImplementation = artifacts.require('ClashingImplementation');
const Ownable = artifacts.require('Ownable');

module.exports = function shouldBehaveLikeTransparentUpgradeableProxy(createProxy, initialOwner, accounts) {
  const [anotherAccount] = accounts;

  async function createProxyWithImpersonatedProxyAdmin(logic, initData, opts = undefined) {
    const proxy = await createProxy(logic, initData, opts);

    // Expect proxy admin to be the first and only contract created by the proxy
    const proxyAdminAddress = computeCreateAddress(proxy.address, 1);
    await impersonate(proxyAdminAddress);

    return {
      proxy,
      proxyAdminAddress,
    };
  }

  before(async function () {
    this.implementationV0 = (await DummyImplementation.new()).address;
    this.implementationV1 = (await DummyImplementation.new()).address;
  });

  beforeEach(async function () {
    const initializeData = Buffer.from('');
    const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
      this.implementationV0,
      initializeData,
    );
    this.proxy = proxy;
    this.proxyAdminAddress = proxyAdminAddress;
  });

  describe('implementation', function () {
    it('returns the current implementation address', async function () {
      const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
      expect(implementationAddress).to.be.equal(this.implementationV0);
    });

    it('delegates to the implementation', async function () {
      const dummy = new DummyImplementation(this.proxy.address);
      const value = await dummy.get();

      expect(value).to.equal(true);
    });
  });

  describe('proxy admin', function () {
    it('emits AdminChanged event during construction', async function () {
      await expectEvent.inConstruction(this.proxy, 'AdminChanged', {
        previousAdmin: ZERO_ADDRESS,
        newAdmin: this.proxyAdminAddress,
      });
    });

    it('sets the proxy admin in storage with the correct initial owner', async function () {
      expect(await getAddressInSlot(this.proxy, AdminSlot)).to.be.equal(this.proxyAdminAddress);
      const proxyAdmin = await Ownable.at(this.proxyAdminAddress);
      expect(await proxyAdmin.owner()).to.be.equal(initialOwner);
    });

    it('can overwrite the admin by the implementation', async function () {
      const dummy = new DummyImplementation(this.proxy.address);
      await dummy.unsafeOverrideAdmin(anotherAccount);
      const ERC1967AdminSlotValue = await getAddressInSlot(this.proxy, AdminSlot);
      expect(ERC1967AdminSlotValue).to.be.equal(anotherAccount);

      // Still allows previous admin to execute admin operations
      expect(ERC1967AdminSlotValue).to.not.equal(this.proxyAdminAddress);
      expectEvent(
        await this.proxy.upgradeToAndCall(this.implementationV1, '0x', { from: this.proxyAdminAddress }),
        'Upgraded',
        {
          implementation: this.implementationV1,
        },
      );
    });
  });

  describe('upgradeToAndCall', function () {
    describe('without migrations', function () {
      beforeEach(async function () {
        this.behavior = await InitializableMock.new();
      });

      describe('when the call does not fail', function () {
        const initializeData = new InitializableMock('').contract.methods['initializeWithX(uint256)'](42).encodeABI();

        describe('when the sender is the admin', function () {
          const value = 1e5;

          beforeEach(async function () {
            this.receipt = await this.proxy.upgradeToAndCall(this.behavior.address, initializeData, {
              from: this.proxyAdminAddress,
              value,
            });
          });

          it('upgrades to the requested implementation', async function () {
            const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
            expect(implementationAddress).to.be.equal(this.behavior.address);
          });

          it('emits an event', function () {
            expectEvent(this.receipt, 'Upgraded', { implementation: this.behavior.address });
          });

          it('calls the initializer function', async function () {
            const migratable = new InitializableMock(this.proxy.address);
            const x = await migratable.x();
            expect(x).to.be.bignumber.equal('42');
          });

          it('sends given value to the proxy', async function () {
            const balance = await web3.eth.getBalance(this.proxy.address);
            expect(balance.toString()).to.be.bignumber.equal(value.toString());
          });

          it('uses the storage of the proxy', async function () {
            // storage layout should look as follows:
            //  - 0: Initializable storage ++ initializerRan ++ onlyInitializingRan
            //  - 1: x
            const storedValue = await web3.eth.getStorageAt(this.proxy.address, 1);
            expect(parseInt(storedValue)).to.eq(42);
          });
        });

        describe('when the sender is not the admin', function () {
          it('reverts', async function () {
            await expectRevert.unspecified(
              this.proxy.upgradeToAndCall(this.behavior.address, initializeData, { from: anotherAccount }),
            );
          });
        });
      });

      describe('when the call does fail', function () {
        const initializeData = new InitializableMock('').contract.methods.fail().encodeABI();

        it('reverts', async function () {
          await expectRevert.unspecified(
            this.proxy.upgradeToAndCall(this.behavior.address, initializeData, { from: this.proxyAdminAddress }),
          );
        });
      });
    });

    describe('with migrations', function () {
      describe('when the sender is the admin', function () {
        const value = 1e5;

        describe('when upgrading to V1', function () {
          const v1MigrationData = new MigratableMockV1('').contract.methods.initialize(42).encodeABI();

          beforeEach(async function () {
            this.behaviorV1 = await MigratableMockV1.new();
            this.balancePreviousV1 = new BN(await web3.eth.getBalance(this.proxy.address));
            this.receipt = await this.proxy.upgradeToAndCall(this.behaviorV1.address, v1MigrationData, {
              from: this.proxyAdminAddress,
              value,
            });
          });

          it('upgrades to the requested version and emits an event', async function () {
            const implementation = await getAddressInSlot(this.proxy, ImplementationSlot);
            expect(implementation).to.be.equal(this.behaviorV1.address);
            expectEvent(this.receipt, 'Upgraded', { implementation: this.behaviorV1.address });
          });

          it("calls the 'initialize' function and sends given value to the proxy", async function () {
            const migratable = new MigratableMockV1(this.proxy.address);

            const x = await migratable.x();
            expect(x).to.be.bignumber.equal('42');

            const balance = await web3.eth.getBalance(this.proxy.address);
            expect(new BN(balance)).to.be.bignumber.equal(this.balancePreviousV1.addn(value));
          });

          describe('when upgrading to V2', function () {
            const v2MigrationData = new MigratableMockV2('').contract.methods.migrate(10, 42).encodeABI();

            beforeEach(async function () {
              this.behaviorV2 = await MigratableMockV2.new();
              this.balancePreviousV2 = new BN(await web3.eth.getBalance(this.proxy.address));
              this.receipt = await this.proxy.upgradeToAndCall(this.behaviorV2.address, v2MigrationData, {
                from: this.proxyAdminAddress,
                value,
              });
            });

            it('upgrades to the requested version and emits an event', async function () {
              const implementation = await getAddressInSlot(this.proxy, ImplementationSlot);
              expect(implementation).to.be.equal(this.behaviorV2.address);
              expectEvent(this.receipt, 'Upgraded', { implementation: this.behaviorV2.address });
            });

            it("calls the 'migrate' function and sends given value to the proxy", async function () {
              const migratable = new MigratableMockV2(this.proxy.address);

              const x = await migratable.x();
              expect(x).to.be.bignumber.equal('10');

              const y = await migratable.y();
              expect(y).to.be.bignumber.equal('42');

              const balance = new BN(await web3.eth.getBalance(this.proxy.address));
              expect(balance).to.be.bignumber.equal(this.balancePreviousV2.addn(value));
            });

            describe('when upgrading to V3', function () {
              const v3MigrationData = new MigratableMockV3('').contract.methods['migrate()']().encodeABI();

              beforeEach(async function () {
                this.behaviorV3 = await MigratableMockV3.new();
                this.balancePreviousV3 = new BN(await web3.eth.getBalance(this.proxy.address));
                this.receipt = await this.proxy.upgradeToAndCall(this.behaviorV3.address, v3MigrationData, {
                  from: this.proxyAdminAddress,
                  value,
                });
              });

              it('upgrades to the requested version and emits an event', async function () {
                const implementation = await getAddressInSlot(this.proxy, ImplementationSlot);
                expect(implementation).to.be.equal(this.behaviorV3.address);
                expectEvent(this.receipt, 'Upgraded', { implementation: this.behaviorV3.address });
              });

              it("calls the 'migrate' function and sends given value to the proxy", async function () {
                const migratable = new MigratableMockV3(this.proxy.address);

                const x = await migratable.x();
                expect(x).to.be.bignumber.equal('42');

                const y = await migratable.y();
                expect(y).to.be.bignumber.equal('10');

                const balance = new BN(await web3.eth.getBalance(this.proxy.address));
                expect(balance).to.be.bignumber.equal(this.balancePreviousV3.addn(value));
              });
            });
          });
        });
      });

      describe('when the sender is not the admin', function () {
        const from = anotherAccount;

        it('reverts', async function () {
          const behaviorV1 = await MigratableMockV1.new();
          const v1MigrationData = new MigratableMockV1('').contract.methods.initialize(42).encodeABI();
          await expectRevert.unspecified(this.proxy.upgradeToAndCall(behaviorV1.address, v1MigrationData, { from }));
        });
      });
    });
  });

  describe('transparent proxy', function () {
    beforeEach('creating proxy', async function () {
      const initializeData = Buffer.from('');
      this.clashingImplV0 = (await ClashingImplementation.new()).address;
      this.clashingImplV1 = (await ClashingImplementation.new()).address;
      const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
        this.clashingImplV0,
        initializeData,
      );
      this.proxy = proxy;
      this.proxyAdminAddress = proxyAdminAddress;
      this.clashing = new ClashingImplementation(this.proxy.address);
    });

    it('proxy admin cannot call delegated functions', async function () {
      await expectRevertCustomError(
        this.clashing.delegatedFunction({ from: this.proxyAdminAddress }),
        'ProxyDeniedAdminAccess',
        [],
      );
    });

    describe('when function names clash', function () {
      it('executes the proxy function if the sender is the admin', async function () {
        const receipt = await this.proxy.upgradeToAndCall(this.clashingImplV1, '0x', {
          from: this.proxyAdminAddress,
        });
        expectEvent(receipt, 'Upgraded', { implementation: this.clashingImplV1 });
      });

      it('delegates the call to implementation when sender is not the admin', async function () {
        const receipt = await this.proxy.upgradeToAndCall(this.clashingImplV1, '0x', {
          from: anotherAccount,
        });
        expectEvent.notEmitted(receipt, 'Upgraded');
        expectEvent.inTransaction(receipt.tx, this.clashing, 'ClashingImplementationCall');
      });
    });
  });

  describe('regression', () => {
    const initializeData = Buffer.from('');

    it('should add new function', async () => {
      const instance1 = await Implementation1.new();
      const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
        instance1.address,
        initializeData,
      );

      const proxyInstance1 = new Implementation1(proxy.address);
      await proxyInstance1.setValue(42);

      const instance2 = await Implementation2.new();
      await proxy.upgradeToAndCall(instance2.address, '0x', { from: proxyAdminAddress });

      const proxyInstance2 = new Implementation2(proxy.address);
      const res = await proxyInstance2.getValue();
      expect(res.toString()).to.eq('42');
    });

    it('should remove function', async () => {
      const instance2 = await Implementation2.new();
      const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
        instance2.address,
        initializeData,
      );

      const proxyInstance2 = new Implementation2(proxy.address);
      await proxyInstance2.setValue(42);
      const res = await proxyInstance2.getValue();
      expect(res.toString()).to.eq('42');

      const instance1 = await Implementation1.new();
      await proxy.upgradeToAndCall(instance1.address, '0x', { from: proxyAdminAddress });

      const proxyInstance1 = new Implementation2(proxy.address);
      await expectRevert.unspecified(proxyInstance1.getValue());
    });

    it('should change function signature', async () => {
      const instance1 = await Implementation1.new();
      const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
        instance1.address,
        initializeData,
      );

      const proxyInstance1 = new Implementation1(proxy.address);
      await proxyInstance1.setValue(42);

      const instance3 = await Implementation3.new();
      await proxy.upgradeToAndCall(instance3.address, '0x', { from: proxyAdminAddress });
      const proxyInstance3 = new Implementation3(proxy.address);

      const res = await proxyInstance3.getValue(8);
      expect(res.toString()).to.eq('50');
    });

    it('should add fallback function', async () => {
      const initializeData = Buffer.from('');
      const instance1 = await Implementation1.new();
      const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
        instance1.address,
        initializeData,
      );

      const instance4 = await Implementation4.new();
      await proxy.upgradeToAndCall(instance4.address, '0x', { from: proxyAdminAddress });
      const proxyInstance4 = new Implementation4(proxy.address);

      const data = '0x';
      await web3.eth.sendTransaction({ to: proxy.address, from: anotherAccount, data });

      const res = await proxyInstance4.getValue();
      expect(res.toString()).to.eq('1');
    });

    it('should remove fallback function', async () => {
      const instance4 = await Implementation4.new();
      const { proxy, proxyAdminAddress } = await createProxyWithImpersonatedProxyAdmin(
        instance4.address,
        initializeData,
      );

      const instance2 = await Implementation2.new();
      await proxy.upgradeToAndCall(instance2.address, '0x', { from: proxyAdminAddress });

      const data = '0x';
      await expectRevert.unspecified(web3.eth.sendTransaction({ to: proxy.address, from: anotherAccount, data }));

      const proxyInstance2 = new Implementation2(proxy.address);
      const res = await proxyInstance2.getValue();
      expect(res.toString()).to.eq('0');
    });
  });
};
