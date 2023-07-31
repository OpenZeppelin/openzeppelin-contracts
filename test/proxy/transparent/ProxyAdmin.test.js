const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ImplV1 = artifacts.require('DummyImplementation');
const ImplV2 = artifacts.require('DummyImplementationV2');
const ProxyAdmin = artifacts.require('ProxyAdmin');
const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy');
const ITransparentUpgradeableProxy = artifacts.require('ITransparentUpgradeableProxy');

const { getAddressInSlot, ImplementationSlot } = require('../../helpers/erc1967');
const { expectRevertCustomError } = require('../../helpers/customError');
const { computeCreateAddress } = require('../../helpers/create');

contract('ProxyAdmin', function (accounts) {
  const [proxyAdminOwner, anotherAccount] = accounts;

  before('set implementations', async function () {
    this.implementationV1 = await ImplV1.new();
    this.implementationV2 = await ImplV2.new();
  });

  beforeEach(async function () {
    const initializeData = Buffer.from('');
    const proxy = await TransparentUpgradeableProxy.new(this.implementationV1.address, proxyAdminOwner, initializeData);

    const proxyNonce = await web3.eth.getTransactionCount(proxy.address);
    const proxyAdminAddress = computeCreateAddress(proxy.address, proxyNonce - 1); // Nonce already used
    this.proxyAdmin = await ProxyAdmin.at(proxyAdminAddress);

    this.proxy = await ITransparentUpgradeableProxy.at(proxy.address);
  });

  it('has an owner', async function () {
    expect(await this.proxyAdmin.owner()).to.equal(proxyAdminOwner);
  });

  it('has an interface version', async function () {
    expect(await this.proxyAdmin.UPGRADE_INTERFACE_VERSION()).to.equal('5.0.0');
  });

  describe('without data', function () {
    context('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        await expectRevertCustomError(
          this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, '0x', {
            from: anotherAccount,
          }),
          'OwnableUnauthorizedAccount',
          [anotherAccount],
        );
      });
    });

    context('with authorized account', function () {
      it('upgrades implementation', async function () {
        await this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, '0x', {
          from: proxyAdminOwner,
        });

        const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
        expect(implementationAddress).to.be.equal(this.implementationV2.address);
      });
    });
  });

  describe('with data', function () {
    context('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        const callData = new ImplV1('').contract.methods.initializeNonPayableWithValue(1337).encodeABI();
        await expectRevertCustomError(
          this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, callData, {
            from: anotherAccount,
          }),
          'OwnableUnauthorizedAccount',
          [anotherAccount],
        );
      });
    });

    context('with authorized account', function () {
      context('with invalid callData', function () {
        it('fails to upgrade', async function () {
          const callData = '0x12345678';
          await expectRevert.unspecified(
            this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, callData, {
              from: proxyAdminOwner,
            }),
          );
        });
      });

      context('with valid callData', function () {
        it('upgrades implementation', async function () {
          const callData = new ImplV1('').contract.methods.initializeNonPayableWithValue(1337).encodeABI();
          await this.proxyAdmin.upgradeAndCall(this.proxy.address, this.implementationV2.address, callData, {
            from: proxyAdminOwner,
          });
          const implementationAddress = await getAddressInSlot(this.proxy, ImplementationSlot);
          expect(implementationAddress).to.be.equal(this.implementationV2.address);
        });
      });
    });
  });
});
