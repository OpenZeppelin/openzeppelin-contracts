const { ethers } = require('hardhat');
const { expect } = require('chai');

const { impersonate } = require('../../helpers/account');
const { getAddressInSlot, ImplementationSlot, AdminSlot } = require('../../helpers/storage');

// createProxy, initialOwner, accounts
module.exports = function shouldBehaveLikeTransparentUpgradeableProxy() {
  before(async function () {
    const implementationV0 = await ethers.deployContract('DummyImplementation');
    const implementationV1 = await ethers.deployContract('DummyImplementation');

    const createProxyWithImpersonatedProxyAdmin = async (logic, initData, opts = undefined) => {
      const [proxy, tx] = await this.createProxy(logic, initData, opts).then(instance =>
        Promise.all([ethers.getContractAt('ITransparentUpgradeableProxy', instance), instance.deploymentTransaction()]),
      );

      const proxyAdmin = await ethers.getContractAt(
        'ProxyAdmin',
        ethers.getCreateAddress({ from: proxy.target, nonce: 1n }),
      );
      const proxyAdminAsSigner = await proxyAdmin.getAddress().then(impersonate);

      return {
        instance: logic.attach(proxy.target), // attaching proxy directly works well for everything except for event resolution
        proxy,
        proxyAdmin,
        proxyAdminAsSigner,
        tx,
      };
    };

    Object.assign(this, {
      implementationV0,
      implementationV1,
      createProxyWithImpersonatedProxyAdmin,
    });
  });

  beforeEach(async function () {
    Object.assign(
      this,
      await this.createProxyWithImpersonatedProxyAdmin(
        this.implementationV0,
        this.implementationV0.interface.encodeFunctionData('initializeNonPayable'),
      ),
    );
  });

  describe('implementation', function () {
    it('returns the current implementation address', async function () {
      expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.implementationV0);
    });

    it('delegates to the implementation', async function () {
      expect(await this.instance.get()).to.be.true;
    });
  });

  describe('proxy admin', function () {
    it('emits AdminChanged event during construction', async function () {
      await expect(this.tx).to.emit(this.proxy, 'AdminChanged').withArgs(ethers.ZeroAddress, this.proxyAdmin);
    });

    it('sets the proxy admin in storage with the correct initial owner', async function () {
      expect(await getAddressInSlot(this.proxy, AdminSlot)).to.equal(this.proxyAdmin);

      expect(await this.proxyAdmin.owner()).to.equal(this.owner);
    });

    it('can overwrite the admin by the implementation', async function () {
      await this.instance.unsafeOverrideAdmin(this.other);

      const ERC1967AdminSlotValue = await getAddressInSlot(this.proxy, AdminSlot);
      expect(ERC1967AdminSlotValue).to.equal(this.other);
      expect(ERC1967AdminSlotValue).to.not.equal(this.proxyAdmin);

      // Still allows previous admin to execute admin operations
      await expect(this.proxy.connect(this.proxyAdminAsSigner).upgradeToAndCall(this.implementationV1, '0x'))
        .to.emit(this.proxy, 'Upgraded')
        .withArgs(this.implementationV1);
    });
  });

  describe('upgradeToAndCall', function () {
    describe('without migrations', function () {
      beforeEach(async function () {
        this.behavior = await ethers.deployContract('InitializableMock');
      });

      describe('when the call does not fail', function () {
        beforeEach(function () {
          this.initializeData = this.behavior.interface.encodeFunctionData('initializeWithX', [42n]);
        });

        describe('when the sender is the admin', function () {
          const value = 10n ** 5n;

          beforeEach(async function () {
            this.tx = await this.proxy
              .connect(this.proxyAdminAsSigner)
              .upgradeToAndCall(this.behavior, this.initializeData, {
                value,
              });
          });

          it('upgrades to the requested implementation', async function () {
            expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.behavior);
          });

          it('emits an event', async function () {
            await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behavior);
          });

          it('calls the initializer function', async function () {
            expect(await this.behavior.attach(this.proxy).x()).to.equal(42n);
          });

          it('sends given value to the proxy', async function () {
            expect(await ethers.provider.getBalance(this.proxy)).to.equal(value);
          });

          it('uses the storage of the proxy', async function () {
            // storage layout should look as follows:
            //  - 0: Initializable storage ++ initializerRan ++ onlyInitializingRan
            //  - 1: x
            expect(await ethers.provider.getStorage(this.proxy, 1n)).to.equal(42n);
          });
        });

        describe('when the sender is not the admin', function () {
          it('reverts', async function () {
            await expect(this.proxy.connect(this.other).upgradeToAndCall(this.behavior, this.initializeData)).to.be
              .reverted;
          });
        });
      });

      describe('when the call does fail', function () {
        beforeEach(function () {
          this.initializeData = this.behavior.interface.encodeFunctionData('fail');
        });

        it('reverts', async function () {
          await expect(this.proxy.connect(this.proxyAdminAsSigner).upgradeToAndCall(this.behavior, this.initializeData))
            .to.be.reverted;
        });
      });
    });

    describe('with migrations', function () {
      describe('when the sender is the admin', function () {
        const value = 10n ** 5n;

        describe('when upgrading to V1', function () {
          beforeEach(async function () {
            this.behaviorV1 = await ethers.deployContract('MigratableMockV1');
            const v1MigrationData = this.behaviorV1.interface.encodeFunctionData('initialize', [42n]);

            this.balancePreviousV1 = await ethers.provider.getBalance(this.proxy);
            this.tx = await this.proxy
              .connect(this.proxyAdminAsSigner)
              .upgradeToAndCall(this.behaviorV1, v1MigrationData, {
                value,
              });
          });

          it('upgrades to the requested version and emits an event', async function () {
            expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.behaviorV1);

            await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behaviorV1);
          });

          it("calls the 'initialize' function and sends given value to the proxy", async function () {
            expect(await this.behaviorV1.attach(this.proxy).x()).to.equal(42n);
            expect(await ethers.provider.getBalance(this.proxy)).to.equal(this.balancePreviousV1 + value);
          });

          describe('when upgrading to V2', function () {
            beforeEach(async function () {
              this.behaviorV2 = await ethers.deployContract('MigratableMockV2');
              const v2MigrationData = this.behaviorV2.interface.encodeFunctionData('migrate', [10n, 42n]);

              this.balancePreviousV2 = await ethers.provider.getBalance(this.proxy);
              this.tx = await this.proxy
                .connect(this.proxyAdminAsSigner)
                .upgradeToAndCall(this.behaviorV2, v2MigrationData, {
                  value,
                });
            });

            it('upgrades to the requested version and emits an event', async function () {
              expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.behaviorV2);

              await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behaviorV2);
            });

            it("calls the 'migrate' function and sends given value to the proxy", async function () {
              expect(await this.behaviorV2.attach(this.proxy).x()).to.equal(10n);
              expect(await this.behaviorV2.attach(this.proxy).y()).to.equal(42n);
              expect(await ethers.provider.getBalance(this.proxy)).to.equal(this.balancePreviousV2 + value);
            });

            describe('when upgrading to V3', function () {
              beforeEach(async function () {
                this.behaviorV3 = await ethers.deployContract('MigratableMockV3');
                const v3MigrationData = this.behaviorV3.interface.encodeFunctionData('migrate()');

                this.balancePreviousV3 = await ethers.provider.getBalance(this.proxy);
                this.tx = await this.proxy
                  .connect(this.proxyAdminAsSigner)
                  .upgradeToAndCall(this.behaviorV3, v3MigrationData, {
                    value,
                  });
              });

              it('upgrades to the requested version and emits an event', async function () {
                expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.behaviorV3);

                await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behaviorV3);
              });

              it("calls the 'migrate' function and sends given value to the proxy", async function () {
                expect(await this.behaviorV3.attach(this.proxy).x()).to.equal(42n);
                expect(await this.behaviorV3.attach(this.proxy).y()).to.equal(10n);
                expect(await ethers.provider.getBalance(this.proxy)).to.equal(this.balancePreviousV3 + value);
              });
            });
          });
        });
      });

      describe('when the sender is not the admin', function () {
        it('reverts', async function () {
          const behaviorV1 = await ethers.deployContract('MigratableMockV1');
          const v1MigrationData = behaviorV1.interface.encodeFunctionData('initialize', [42n]);
          await expect(this.proxy.connect(this.other).upgradeToAndCall(behaviorV1, v1MigrationData)).to.be.reverted;
        });
      });
    });
  });

  describe('transparent proxy', function () {
    beforeEach('creating proxy', async function () {
      this.clashingImplV0 = await ethers.deployContract('ClashingImplementation');
      this.clashingImplV1 = await ethers.deployContract('ClashingImplementation');

      Object.assign(
        this,
        await this.createProxyWithImpersonatedProxyAdmin(
          this.clashingImplV0,
          this.clashingImplV0.interface.encodeFunctionData('delegatedFunction'), // use a pure function with no state change as dummy initializer.
        ),
      );
    });

    it('proxy admin cannot call delegated functions', async function () {
      const factory = await ethers.getContractFactory('TransparentUpgradeableProxy');

      await expect(this.instance.connect(this.proxyAdminAsSigner).delegatedFunction()).to.be.revertedWithCustomError(
        factory,
        'ProxyDeniedAdminAccess',
      );
    });

    describe('when function names clash', function () {
      it('executes the proxy function if the sender is the admin', async function () {
        await expect(this.proxy.connect(this.proxyAdminAsSigner).upgradeToAndCall(this.clashingImplV1, '0x'))
          .to.emit(this.proxy, 'Upgraded')
          .withArgs(this.clashingImplV1);
      });

      it('delegates the call to implementation when sender is not the admin', async function () {
        await expect(this.proxy.connect(this.other).upgradeToAndCall(this.clashingImplV1, '0x'))
          .to.emit(this.instance, 'ClashingImplementationCall')
          .to.not.emit(this.proxy, 'Upgraded');
      });
    });
  });

  describe('regression', function () {
    it('should add new function', async function () {
      const impl1 = await ethers.deployContract('Implementation1');
      const impl2 = await ethers.deployContract('Implementation2');
      const { instance, proxy, proxyAdminAsSigner } = await this.createProxyWithImpersonatedProxyAdmin(
        impl1,
        impl1.interface.encodeFunctionData('initialize'),
      );

      await instance.setValue(42n);

      // `getValue` is not available in impl1
      await expect(impl2.attach(instance).getValue()).to.be.reverted;

      // do upgrade
      await proxy.connect(proxyAdminAsSigner).upgradeToAndCall(impl2, '0x');

      // `getValue` is available in impl2
      expect(await impl2.attach(instance).getValue()).to.equal(42n);
    });

    it('should remove function', async function () {
      const impl1 = await ethers.deployContract('Implementation1');
      const impl2 = await ethers.deployContract('Implementation2');
      const { instance, proxy, proxyAdminAsSigner } = await this.createProxyWithImpersonatedProxyAdmin(
        impl2,
        impl2.interface.encodeFunctionData('initialize'),
      );

      await instance.setValue(42n);

      // `getValue` is available in impl2
      expect(await impl2.attach(instance).getValue()).to.equal(42n);

      // do downgrade
      await proxy.connect(proxyAdminAsSigner).upgradeToAndCall(impl1, '0x');

      // `getValue` is not available in impl1
      await expect(impl2.attach(instance).getValue()).to.be.reverted;
    });

    it('should change function signature', async function () {
      const impl1 = await ethers.deployContract('Implementation1');
      const impl3 = await ethers.deployContract('Implementation3');
      const { instance, proxy, proxyAdminAsSigner } = await this.createProxyWithImpersonatedProxyAdmin(
        impl1,
        impl1.interface.encodeFunctionData('initialize'),
      );

      await instance.setValue(42n);

      await proxy.connect(proxyAdminAsSigner).upgradeToAndCall(impl3, '0x');

      expect(await impl3.attach(instance).getValue(8n)).to.equal(50n);
    });

    it('should add fallback function', async function () {
      const impl1 = await ethers.deployContract('Implementation1');
      const impl4 = await ethers.deployContract('Implementation4');
      const { instance, proxy, proxyAdminAsSigner } = await this.createProxyWithImpersonatedProxyAdmin(
        impl1,
        impl1.interface.encodeFunctionData('initialize'),
      );

      await proxy.connect(proxyAdminAsSigner).upgradeToAndCall(impl4, '0x');

      await this.other.sendTransaction({ to: proxy });

      expect(await impl4.attach(instance).getValue()).to.equal(1n);
    });

    it('should remove fallback function', async function () {
      const impl2 = await ethers.deployContract('Implementation2');
      const impl4 = await ethers.deployContract('Implementation4');
      const { instance, proxy, proxyAdminAsSigner } = await this.createProxyWithImpersonatedProxyAdmin(
        impl4,
        impl4.interface.encodeFunctionData('initialize'),
      );

      await proxy.connect(proxyAdminAsSigner).upgradeToAndCall(impl2, '0x');

      await expect(this.other.sendTransaction({ to: proxy })).to.be.reverted;

      expect(await impl2.attach(instance).getValue()).to.equal(0n);
    });
  });
};
