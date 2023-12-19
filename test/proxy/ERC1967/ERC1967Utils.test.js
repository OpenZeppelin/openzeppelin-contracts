const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getAddressInSlot, setSlot, ImplementationSlot, AdminSlot, BeaconSlot } = require('../../helpers/erc1967');

async function fixture() {
  const [, admin, anotherAccount] = await ethers.getSigners();

  const utils = await ethers.deployContract('$ERC1967Utils');
  const v1 = await ethers.deployContract('DummyImplementation');
  const v2 = await ethers.deployContract('CallReceiverMock');

  return { admin, anotherAccount, utils, v1, v2 };
}

describe('ERC1967Utils', function () {
  beforeEach('setup', async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('IMPLEMENTATION_SLOT', function () {
    beforeEach('set v1 implementation', async function () {
      await setSlot(this.utils, ImplementationSlot, this.v1);
    });

    describe('getImplementation', function () {
      it('returns current implementation and matches implementation slot value', async function () {
        expect(await this.utils.$getImplementation()).to.equal(this.v1.target);
        expect(await getAddressInSlot(this.utils, ImplementationSlot)).to.equal(this.v1.target);
      });
    });

    describe('upgradeToAndCall', function () {
      it('sets implementation in storage and emits event', async function () {
        const newImplementation = this.v2;
        const tx = await this.utils.$upgradeToAndCall(newImplementation, '0x');

        expect(await getAddressInSlot(this.utils, ImplementationSlot)).to.equal(newImplementation.target);
        await expect(tx).to.emit(this.utils, 'Upgraded').withArgs(newImplementation.target);
      });

      it('reverts when implementation does not contain code', async function () {
        await expect(this.utils.$upgradeToAndCall(this.anotherAccount, '0x'))
          .to.be.revertedWithCustomError(this.utils, 'ERC1967InvalidImplementation')
          .withArgs(this.anotherAccount.address);
      });

      describe('when data is empty', function () {
        it('reverts when value is sent', async function () {
          await expect(this.utils.$upgradeToAndCall(this.v2, '0x', { value: 1 })).to.be.revertedWithCustomError(
            this.utils,
            'ERC1967NonPayable',
          );
        });
      });

      describe('when data is not empty', function () {
        it('delegates a call to the new implementation', async function () {
          const initializeData = this.v2.interface.encodeFunctionData('mockFunction');
          const tx = await this.utils.$upgradeToAndCall(this.v2, initializeData);
          await expect(tx).to.emit(await ethers.getContractAt('CallReceiverMock', this.utils), 'MockFunctionCalled');
        });
      });
    });
  });

  describe('ADMIN_SLOT', function () {
    beforeEach('set admin', async function () {
      await setSlot(this.utils, AdminSlot, this.admin);
    });

    describe('getAdmin', function () {
      it('returns current admin and matches admin slot value', async function () {
        expect(await this.utils.$getAdmin()).to.equal(this.admin.address);
        expect(await getAddressInSlot(this.utils, AdminSlot)).to.equal(this.admin.address);
      });
    });

    describe('changeAdmin', function () {
      it('sets admin in storage and emits event', async function () {
        const newAdmin = this.anotherAccount;
        const tx = await this.utils.$changeAdmin(newAdmin);

        expect(await getAddressInSlot(this.utils, AdminSlot)).to.equal(newAdmin.address);
        await expect(tx).to.emit(this.utils, 'AdminChanged').withArgs(this.admin.address, newAdmin.address);
      });

      it('reverts when setting the address zero as admin', async function () {
        await expect(this.utils.$changeAdmin(ethers.ZeroAddress))
          .to.be.revertedWithCustomError(this.utils, 'ERC1967InvalidAdmin')
          .withArgs(ethers.ZeroAddress);
      });
    });
  });

  describe('BEACON_SLOT', function () {
    beforeEach('set beacon', async function () {
      this.beacon = await ethers.deployContract('UpgradeableBeaconMock', [this.v1]);
      await setSlot(this.utils, BeaconSlot, this.beacon);
    });

    describe('getBeacon', function () {
      it('returns current beacon and matches beacon slot value', async function () {
        expect(await this.utils.$getBeacon()).to.equal(this.beacon.target);
        expect(await getAddressInSlot(this.utils, BeaconSlot)).to.equal(this.beacon.target);
      });
    });

    describe('upgradeBeaconToAndCall', function () {
      it('sets beacon in storage and emits event', async function () {
        const newBeacon = await ethers.deployContract('UpgradeableBeaconMock', [this.v2]);
        const tx = await this.utils.$upgradeBeaconToAndCall(newBeacon, '0x');

        expect(await getAddressInSlot(this.utils, BeaconSlot)).to.equal(newBeacon.target);
        await expect(tx).to.emit(this.utils, 'BeaconUpgraded').withArgs(newBeacon.target);
      });

      it('reverts when beacon does not contain code', async function () {
        await expect(this.utils.$upgradeBeaconToAndCall(this.anotherAccount, '0x'))
          .to.be.revertedWithCustomError(this.utils, 'ERC1967InvalidBeacon')
          .withArgs(this.anotherAccount.address);
      });

      it("reverts when beacon's implementation does not contain code", async function () {
        const newBeacon = await ethers.deployContract('UpgradeableBeaconMock', [this.anotherAccount]);

        await expect(this.utils.$upgradeBeaconToAndCall(newBeacon, '0x'))
          .to.be.revertedWithCustomError(this.utils, 'ERC1967InvalidImplementation')
          .withArgs(this.anotherAccount.address);
      });

      describe('when data is empty', function () {
        it('reverts when value is sent', async function () {
          const newBeacon = await ethers.deployContract('UpgradeableBeaconMock', [this.v2]);
          await expect(this.utils.$upgradeBeaconToAndCall(newBeacon, '0x', { value: 1 })).to.be.revertedWithCustomError(
            this.utils,
            'ERC1967NonPayable',
          );
        });
      });

      describe('when data is not empty', function () {
        it('delegates a call to the new implementation', async function () {
          const initializeData = this.v2.interface.encodeFunctionData('mockFunction');
          const newBeacon = await ethers.deployContract('UpgradeableBeaconMock', [this.v2]);
          const tx = await this.utils.$upgradeBeaconToAndCall(newBeacon, initializeData);
          await expect(tx).to.emit(await ethers.getContractAt('CallReceiverMock', this.utils), 'MockFunctionCalled');
        });
      });

      describe('reentrant beacon implementation() call', function () {
        it('sees the new beacon implementation', async function () {
          const newBeacon = await ethers.deployContract('UpgradeableBeaconReentrantMock');
          await expect(this.utils.$upgradeBeaconToAndCall(newBeacon, '0x'))
            .to.be.revertedWithCustomError(newBeacon, 'BeaconProxyBeaconSlotAddress')
            .withArgs(newBeacon.target);
        });
      });
    });
  });
});
