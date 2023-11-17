const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getAddressInSlot, ImplementationSlot } = require('../../helpers/erc1967');

async function fixture() {
  const [proxyAdminOwner, anotherAccount] = await ethers.getSigners();

  const v1 = await ethers.deployContract('DummyImplementation');
  const v2 = await ethers.deployContract('DummyImplementationV2');
  const proxyTmp = await ethers.deployContract('TransparentUpgradeableProxy', [v1, proxyAdminOwner, '0x']);

  const proxyNonce = await ethers.provider.getTransactionCount(proxyTmp);
  const proxyAdminAddress = ethers.getCreateAddress({ from: proxyTmp.target, nonce: proxyNonce - 1 }); // Nonce already used

  const proxy = await ethers.getContractAt('ITransparentUpgradeableProxy', proxyTmp);
  const proxyAdmin = await ethers.getContractAt('ProxyAdmin', proxyAdminAddress);

  return { proxyAdminOwner, anotherAccount, v1, v2, proxy, proxyAdmin };
}

describe('ProxyAdmin', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('has an owner', async function () {
    expect(await this.proxyAdmin.owner()).to.equal(this.proxyAdminOwner.address);
  });

  it('has an interface version', async function () {
    expect(await this.proxyAdmin.UPGRADE_INTERFACE_VERSION()).to.equal('5.0.0');
  });

  describe('without data', function () {
    context('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        await expect(this.proxyAdmin.connect(this.anotherAccount).upgradeAndCall(this.proxy, this.v2, '0x'))
          .to.be.revertedWithCustomError(this.proxyAdmin, 'OwnableUnauthorizedAccount')
          .withArgs(this.anotherAccount.address);
      });
    });

    context('with authorized account', function () {
      it('upgrades implementation', async function () {
        await this.proxyAdmin.connect(this.proxyAdminOwner).upgradeAndCall(this.proxy, this.v2, '0x');
        expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.be.equal(this.v2.target);
      });
    });
  });

  describe('with data', function () {
    context('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        const callData = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [1337n]);
        await expect(this.proxyAdmin.connect(this.anotherAccount).upgradeAndCall(this.proxy, this.v2, callData))
          .to.be.revertedWithCustomError(this.proxyAdmin, 'OwnableUnauthorizedAccount')
          .withArgs(this.anotherAccount.address);
      });
    });

    context('with authorized account', function () {
      context('with invalid callData', function () {
        it('fails to upgrade', async function () {
          const callData = '0x12345678';
          await expect(this.proxyAdmin.connect(this.proxyAdminOwner).upgradeAndCall(this.proxy, this.v2, callData)).to
            .be.reverted;
        });
      });

      context('with valid callData', function () {
        it('upgrades implementation', async function () {
          const callData = this.v2.interface.encodeFunctionData('initializeNonPayableWithValue', [1337n]);
          await this.proxyAdmin.connect(this.proxyAdminOwner).upgradeAndCall(this.proxy, this.v2, callData);
          expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.be.equal(this.v2.target);
        });
      });
    });
  });
});
