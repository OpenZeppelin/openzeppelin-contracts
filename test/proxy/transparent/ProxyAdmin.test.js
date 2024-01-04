const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getAddressInSlot, ImplementationSlot } = require('../../helpers/storage');

async function fixture() {
  const [admin, other] = await ethers.getSigners();

  const v1 = await ethers.deployContract('DummyImplementation');
  const v2 = await ethers.deployContract('DummyImplementationV2');

  const proxy = await ethers
    .deployContract('TransparentUpgradeableProxy', [v1, admin, '0x'])
    .then(instance => ethers.getContractAt('ITransparentUpgradeableProxy', instance));

  const proxyAdmin = await ethers.getContractAt(
    'ProxyAdmin',
    ethers.getCreateAddress({ from: proxy.target, nonce: 1n }),
  );

  return { admin, other, v1, v2, proxy, proxyAdmin };
}

describe('ProxyAdmin', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('has an owner', async function () {
    expect(await this.proxyAdmin.owner()).to.equal(this.admin);
  });

  it('has an interface version', async function () {
    expect(await this.proxyAdmin.UPGRADE_INTERFACE_VERSION()).to.equal('5.0.0');
  });

  describe('without data', function () {
    describe('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        await expect(this.proxyAdmin.connect(this.other).upgradeAndCall(this.proxy, this.v2, '0x'))
          .to.be.revertedWithCustomError(this.proxyAdmin, 'OwnableUnauthorizedAccount')
          .withArgs(this.other);
      });
    });

    describe('with authorized account', function () {
      it('upgrades implementation', async function () {
        await this.proxyAdmin.connect(this.admin).upgradeAndCall(this.proxy, this.v2, '0x');
        expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.v2);
      });
    });
  });

  describe('with data', function () {
    describe('with unauthorized account', function () {
      it('fails to upgrade', async function () {
        const data = this.v1.interface.encodeFunctionData('initializeNonPayableWithValue', [1337n]);
        await expect(this.proxyAdmin.connect(this.other).upgradeAndCall(this.proxy, this.v2, data))
          .to.be.revertedWithCustomError(this.proxyAdmin, 'OwnableUnauthorizedAccount')
          .withArgs(this.other);
      });
    });

    describe('with authorized account', function () {
      describe('with invalid callData', function () {
        it('fails to upgrade', async function () {
          const data = '0x12345678';
          await expect(this.proxyAdmin.connect(this.admin).upgradeAndCall(this.proxy, this.v2, data)).to.be.reverted;
        });
      });

      describe('with valid callData', function () {
        it('upgrades implementation', async function () {
          const data = this.v2.interface.encodeFunctionData('initializeNonPayableWithValue', [1337n]);
          await this.proxyAdmin.connect(this.admin).upgradeAndCall(this.proxy, this.v2, data);
          expect(await getAddressInSlot(this.proxy, ImplementationSlot)).to.equal(this.v2);
        });
      });
    });
  });
});
