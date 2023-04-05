const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ImplV1 = artifacts.require('DummyImplementation');
const ImplV2 = artifacts.require('DummyImplementationV2');
const ProxyAdmin = artifacts.require('ProxyAdmin');
const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy');
const ITransparentUpgradeableProxy = artifacts.require('ITransparentUpgradeableProxy');

contract('ProxyAdmin', function (accounts) {
  const [proxyAdminOwner, newAdmin, anotherAccount] = accounts;

  before('set implementations', async function () {
    this.implementationV1 = await ImplV1.new();
    this.implementationV2 = await ImplV2.new();
  });

  beforeEach(async function () {
    const initializeData = Buffer.from('');
    this.proxyAdmin = await ProxyAdmin.new({ from: proxyAdminOwner });
    const proxy = await TransparentUpgradeableProxy.new(
      this.implementationV1.address,
      this.proxyAdmin.address,
      initializeData,
      { from: proxyAdminOwner },
    );
    this.proxy = await ITransparentUpgradeableProxy.at(proxy.address);
  });

  it('has an owner', async function () {
    expect(await this.proxyAdmin.owner()).to.equal(proxyAdminOwner);
  });

  describe('#getProxyAdmin', function () {
    it('returns proxyAdmin as admin of the proxy', async function () {
      const admin = await this.proxyAdmin.getProxyAdmin(this.proxy.address);
      expect(admin).to.be.equal(this.proxyAdmin.address);
    });

    it('call to invalid proxy', async function () {
      await expectRevert.unspecified(this.proxyAdmin.getProxyAdmin(this.implementationV1.address));
    });
  });

  describe('#changeProxyAdmin', function () {
    it('fails to change proxy admin if its not the proxy owner', async function () {
      await expectRevert(
        this.proxyAdmin.changeProxyAdmin(this.proxy.address, newAdmin, { from: anotherAccount }),
        'caller is not the owner',
      );
    });

    it('changes proxy admin', async function () {
      await this.proxyAdmin.changeProxyAdmin(this.proxy.address, newAdmin, { from: proxyAdminOwner });
      expect(await this.proxy.admin.call({ from: newAdmin })).to.eq(newAdmin);
    });
  });

  describe('#getProxyImplementation', function () {
    it('returns proxy implementation address', async function () {
      const implementationAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
      expect(implementationAddress).to.be.equal(this.implementationV1.address);
    });

    it('call to invalid proxy', async function () {
      await expectRevert.unspecified(this.proxyAdmin.getProxyImplementation(this.implementationV1.address));
    });
  });

  describe('#upgrade', function () {
    context('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        await expectRevert(
          this.proxyAdmin.upgrade(this.proxy.address, this.implementationV2.address, { from: anotherAccount }),
          'caller is not the owner',
        );
      });
    });

    context('with authorized account', function () {
      it('upgrades implementation', async function () {
        await this.proxyAdmin.upgrade(this.proxy.address, this.implementationV2.address, { from: proxyAdminOwner });
        const implementationAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
        expect(implementationAddress).to.be.equal(this.implementationV2.address);
      });
    });
  });

  describe('#upgradeAndCall', function () {
    context('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        const callData = new ImplV1('').contract.methods.initializeNonPayableWithValue(1337).encodeABI();
        await expectRevert(
          this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, callData,
            { from: anotherAccount },
          ),
          'caller is not the owner',
        );
      });
    });

    context('with authorized account', function () {
      context('with invalid callData', function () {
        it('fails to upgrade', async function () {
          const callData = '0x12345678';
          await expectRevert.unspecified(
            this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, callData,
              { from: proxyAdminOwner },
            ),
          );
        });
      });

      context('with valid callData', function () {
        it('upgrades implementation', async function () {
          const callData = new ImplV1('').contract.methods.initializeNonPayableWithValue(1337).encodeABI();
          await this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, callData,
            { from: proxyAdminOwner },
          );
          const implementationAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
          expect(implementationAddress).to.be.equal(this.implementationV2.address);
        });
      });
    });
  });
});
