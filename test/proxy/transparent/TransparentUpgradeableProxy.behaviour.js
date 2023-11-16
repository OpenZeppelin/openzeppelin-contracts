const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getAddressInSlot, ImplementationSlot, AdminSlot } = require('../../helpers/erc1967');
const { impersonate } = require('../../helpers/account');

// createProxy, initialOwner, accounts
module.exports = function shouldBehaveLikeTransparentUpgradeableProxy() {
  before(async function () {
    this.createProxyWithImpersonatedProxyAdmin = async (logic, initData, opts = undefined) => {
      const proxyTmp = await this.createProxy(logic, initData, opts);
      const proxy = await ethers.getContractAt('ITransparentUpgradeableProxy', proxyTmp);
      const tx = proxyTmp.deploymentTransaction();

      // Expect proxy admin to be the first and only contract created by the proxy
      const proxyAdminAddress = ethers.getCreateAddress({ from: proxyTmp.target, nonce: 1 });
      await impersonate(proxyAdminAddress);
      const proxyAdmin = await ethers.getImpersonatedSigner(proxyAdminAddress);

      return {
        proxy,
        proxyAdmin,
        tx,
      };
    };

    this.implementationV0 = await ethers.deployContract('DummyImplementation');
    this.implementationV1 = await ethers.deployContract('DummyImplementation');
  });

  beforeEach(async function () {
    Object.assign(this, await this.createProxyWithImpersonatedProxyAdmin(this.implementationV0, '0x'));
  });

  describe('implementation', function () {
    it('returns the current implementation address', async function () {
      const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
      expect(implementationAddress).to.be.equal(this.implementationV0.target);
    });

    it('delegates to the implementation', async function () {
      const dummy = await ethers.getContractAt('DummyImplementation', this.proxy);
      const value = await dummy.get();

      expect(value).to.equal(true);
    });
  });

  describe('proxy admin', function () {
    it('emits AdminChanged event during construction', async function () {
      console.log(this.proxyAdminAddress);
      await expect(this.tx).to.emit(this.proxy, 'AdminChanged').withArgs(ethers.ZeroAddress, this.proxyAdmin.address);
    });

    it('sets the proxy admin in storage with the correct initial owner', async function () {
      expect(await getAddressInSlot(this.proxy, AdminSlot)).to.be.equal(this.proxyAdmin.address);
      const proxyAdmin = await ethers.getContractAt('Ownable', this.proxyAdmin);
      expect(await proxyAdmin.owner()).to.be.equal(this.owner.address);
    });

    it('can overwrite the admin by the implementation', async function () {
      const dummy = await ethers.getContractAt('DummyImplementation', this.proxy);
      await dummy.unsafeOverrideAdmin(this.anotherAccount);
      const ERC1967AdminSlotValue = await getAddressInSlot(this.proxy, AdminSlot);
      expect(ERC1967AdminSlotValue).to.be.equal(this.anotherAccount.address);

      // Still allows previous admin to execute admin operations
      expect(ERC1967AdminSlotValue).to.not.equal(this.proxyAdmin.address);
      await expect(this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.implementationV1, '0x'))
        .to.emit(this.proxy, 'Upgraded')
        .withArgs(this.implementationV1.target);
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
            this.tx = await this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.behavior, this.initializeData, {
              value,
            });
          });

          it('upgrades to the requested implementation', async function () {
            const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
            expect(implementationAddress).to.be.equal(this.behavior.target);
          });

          it('emits an event', async function () {
            await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behavior.target);
          });

          it('calls the initializer function', async function () {
            const migratable = await ethers.getContractAt('InitializableMock', this.proxy);
            const x = await migratable.x();
            expect(x).to.be.equal(42n);
          });

          it('sends given value to the proxy', async function () {
            const balance = await ethers.provider.getBalance(this.proxy);
            expect(balance).to.be.equal(value);
          });

          it('uses the storage of the proxy', async function () {
            // storage layout should look as follows:
            //  - 0: Initializable storage ++ initializerRan ++ onlyInitializingRan
            //  - 1: x
            const storedValue = await ethers.provider.getStorage(this.proxy, 1n);
            expect(storedValue).to.eq(42n);
          });
        });

        describe('when the sender is not the admin', function () {
          it('reverts', async function () {
            await expect(this.proxy.connect(this.anotherAccount).upgradeToAndCall(this.behavior, this.initializeData))
              .to.be.reverted;
          });
        });
      });

      describe('when the call does fail', function () {
        beforeEach(function () {
          this.initializeData = this.behavior.interface.encodeFunctionData('fail');
        });

        it('reverts', async function () {
          await expect(this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.behavior, this.initializeData)).to.be
            .reverted;
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
            this.tx = await this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.behaviorV1, v1MigrationData, {
              value,
            });
          });

          it('upgrades to the requested version and emits an event', async function () {
            const implementation = await getAddressInSlot(this.proxy, ImplementationSlot);
            expect(implementation).to.be.equal(this.behaviorV1.target);
            await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behaviorV1.target);
          });

          it("calls the 'initialize' function and sends given value to the proxy", async function () {
            const migratable = await ethers.getContractAt('MigratableMockV1', this.proxy);

            const x = await migratable.x();
            expect(x).to.be.equal(42n);

            const balance = await ethers.provider.getBalance(this.proxy);
            expect(balance).to.be.equal(this.balancePreviousV1 + value);
          });

          describe('when upgrading to V2', function () {
            beforeEach(async function () {
              this.behaviorV2 = await ethers.deployContract('MigratableMockV2');
              const v2MigrationData = this.behaviorV2.interface.encodeFunctionData('migrate', [10n, 42n]);

              this.balancePreviousV2 = await ethers.provider.getBalance(this.proxy);
              this.tx = await this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.behaviorV2, v2MigrationData, {
                value,
              });
            });

            it('upgrades to the requested version and emits an event', async function () {
              const implementation = await getAddressInSlot(this.proxy, ImplementationSlot);
              expect(implementation).to.be.equal(this.behaviorV2.target);
              await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behaviorV2.target);
            });

            it("calls the 'migrate' function and sends given value to the proxy", async function () {
              const migratable = await ethers.getContractAt('MigratableMockV2', this.proxy);

              const x = await migratable.x();
              expect(x).to.be.equal(10n);

              const y = await migratable.y();
              expect(y).to.be.equal(42n);

              const balance = await ethers.provider.getBalance(this.proxy);
              expect(balance).to.be.equal(this.balancePreviousV2 + value);
            });

            describe('when upgrading to V3', function () {
              beforeEach(async function () {
                this.behaviorV3 = await ethers.deployContract('MigratableMockV3');
                const v3MigrationData = this.behaviorV3.interface.encodeFunctionData('migrate()');

                this.balancePreviousV3 = await ethers.provider.getBalance(this.proxy);
                this.tx = await this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.behaviorV3, v3MigrationData, {
                  value,
                });
              });

              it('upgrades to the requested version and emits an event', async function () {
                const implementation = await getAddressInSlot(this.proxy, ImplementationSlot);
                expect(implementation).to.be.equal(this.behaviorV3.target);
                await expect(this.tx).to.emit(this.proxy, 'Upgraded').withArgs(this.behaviorV3.target);
              });

              it("calls the 'migrate' function and sends given value to the proxy", async function () {
                const migratable = await ethers.getContractAt('MigratableMockV3', this.proxy);
                expect(await migratable.x()).to.be.equal(42n);
                expect(await migratable.y()).to.be.equal(10n);
                expect(await ethers.provider.getBalance(this.proxy)).to.be.equal(this.balancePreviousV3 + value);
              });
            });
          });
        });
      });

      describe('when the sender is not the admin', function () {
        const from = this.anotherAccount;

        it('reverts', async function () {
          const behaviorV1 = await ethers.deployContract('MigratableMockV1');
          const v1MigrationData = behaviorV1.interface.encodeFunctionData('initialize', [42n]);
          await expect(this.proxy.connect(from).upgradeToAndCall(behaviorV1, v1MigrationData));
        });
      });
    });
  });

  describe('transparent proxy', function () {
    beforeEach('creating proxy', async function () {
      this.clashingImplV0 = await ethers.deployContract('ClashingImplementation');
      this.clashingImplV1 = await ethers.deployContract('ClashingImplementation');

      Object.assign(this, await this.createProxyWithImpersonatedProxyAdmin(this.clashingImplV0, '0x'));
      this.clashing = await ethers.getContractAt('ClashingImplementation', this.proxy);
    });

    it('proxy admin cannot call delegated functions', async function () {
      await expect(this.clashing.connect(this.proxyAdmin).delegatedFunction()).to.be.revertedWithCustomError(
        await ethers.getContractFactory('TransparentUpgradeableProxy'),
        'ProxyDeniedAdminAccess',
      );
    });

    describe('when function names clash', function () {
      it('executes the proxy function if the sender is the admin', async function () {
        const tx = await this.proxy.connect(this.proxyAdmin).upgradeToAndCall(this.clashingImplV1, '0x');
        await expect(tx).to.emit(this.proxy, 'Upgraded').withArgs(this.clashingImplV1.target);
      });

      it('delegates the call to implementation when sender is not the admin', async function () {
        const tx = await this.proxy.connect(this.anotherAccount).upgradeToAndCall(this.clashingImplV1, '0x');
        await expect(tx).to.not.emit(this.proxy, 'Upgraded');
        await expect(tx).to.emit(this.clashing, 'ClashingImplementationCall');
      });
    });
  });

  describe('regression', function () {
    const initializeData = '0x';

    it('should add new function', async function () {
      const instance1 = await ethers.deployContract('Implementation1');
      const { proxy, proxyAdmin } = await this.createProxyWithImpersonatedProxyAdmin(instance1, initializeData);

      const proxyInstance1 = await ethers.getContractAt('Implementation1', proxy);
      await proxyInstance1.setValue(42n);

      const instance2 = await ethers.deployContract('Implementation2');
      await proxy.connect(proxyAdmin).upgradeToAndCall(instance2, '0x');

      const proxyInstance2 = await ethers.getContractAt('Implementation2', proxy);
      expect(await proxyInstance2.getValue()).to.eq(42n);
    });

    it('should remove function', async function () {
      const instance2 = await ethers.deployContract('Implementation2');
      const { proxy, proxyAdmin } = await this.createProxyWithImpersonatedProxyAdmin(instance2, initializeData);

      const proxyInstance2 = await ethers.getContractAt('Implementation2', proxy);
      await proxyInstance2.setValue(42n);
      expect(await proxyInstance2.getValue()).to.eq(42n);

      const instance1 = await ethers.deployContract('Implementation1');
      await proxy.connect(proxyAdmin).upgradeToAndCall(instance1, '0x');

      const proxyInstance1 = await ethers.getContractAt('Implementation2', proxy);
      await expect(proxyInstance1.getValue()).to.be.reverted;
    });

    it('should change function signature', async function () {
      const instance1 = await ethers.deployContract('Implementation1');
      const { proxy, proxyAdmin } = await this.createProxyWithImpersonatedProxyAdmin(instance1, initializeData);

      const proxyInstance1 = await ethers.getContractAt('Implementation1', proxy);
      await proxyInstance1.setValue(42n);

      const instance3 = await ethers.deployContract('Implementation3');
      await proxy.connect(proxyAdmin).upgradeToAndCall(instance3, '0x');
      const proxyInstance3 = await ethers.getContractAt('Implementation3', proxy);

      expect(await proxyInstance3.getValue(8n)).to.eq(50n);
    });

    it('should add fallback function', async function () {
      const instance1 = await ethers.deployContract('Implementation1');
      const { proxy, proxyAdmin } = await this.createProxyWithImpersonatedProxyAdmin(instance1, initializeData);

      const instance4 = await ethers.deployContract('Implementation4');
      await proxy.connect(proxyAdmin).upgradeToAndCall(instance4, '0x');
      const proxyInstance4 = await ethers.getContractAt('Implementation4', proxy);

      await this.anotherAccount.sendTransaction({ to: proxy });
      expect(await proxyInstance4.getValue()).to.eq(1n);
    });

    it('should remove fallback function', async function () {
      const instance4 = await ethers.deployContract('Implementation4');
      const { proxy, proxyAdmin } = await this.createProxyWithImpersonatedProxyAdmin(instance4, initializeData);

      const instance2 = await ethers.deployContract('Implementation2');
      await proxy.connect(proxyAdmin).upgradeToAndCall(instance2, '0x');

      await expect(this.anotherAccount.sendTransaction({ to: proxy })).to.be.reverted;

      const proxyInstance2 = await ethers.getContractAt('Implementation2', proxy);
      expect(await proxyInstance2.getValue()).to.eq(0n);
    });
  });
};
