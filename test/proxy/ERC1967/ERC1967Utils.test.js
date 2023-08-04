const { expectEvent, constants } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');
const { getAddressInSlot, setSlot, ImplementationSlot, AdminSlot, BeaconSlot } = require('../../helpers/erc1967');

const { ZERO_ADDRESS } = constants;

const ERC1967Utils = artifacts.require('$ERC1967Utils');

const V1 = artifacts.require('DummyImplementation');
const V2 = artifacts.require('CallReceiverMock');
const UpgradeableBeaconMock = artifacts.require('UpgradeableBeaconMock');
const UpgradeableBeaconReentrantMock = artifacts.require('UpgradeableBeaconReentrantMock');

contract('ERC1967Utils', function (accounts) {
  const [, admin, anotherAccount] = accounts;
  const EMPTY_DATA = '0x';

  beforeEach('setup', async function () {
    this.utils = await ERC1967Utils.new();
    this.v1 = await V1.new();
    this.v2 = await V2.new();
  });

  describe('IMPLEMENTATION_SLOT', function () {
    beforeEach('set v1 implementation', async function () {
      await setSlot(this.utils, ImplementationSlot, this.v1.address);
    });

    describe('getImplementation', function () {
      it('returns current implementation and matches implementation slot value', async function () {
        expect(await this.utils.$getImplementation()).to.equal(this.v1.address);
        expect(await getAddressInSlot(this.utils.address, ImplementationSlot)).to.equal(this.v1.address);
      });
    });

    describe('upgradeToAndCall', function () {
      it('sets implementation in storage and emits event', async function () {
        const newImplementation = this.v2.address;
        const receipt = await this.utils.$upgradeToAndCall(newImplementation, EMPTY_DATA);

        expect(await getAddressInSlot(this.utils.address, ImplementationSlot)).to.equal(newImplementation);
        expectEvent(receipt, 'Upgraded', { implementation: newImplementation });
      });

      it('reverts when implementation does not contain code', async function () {
        await expectRevertCustomError(
          this.utils.$upgradeToAndCall(anotherAccount, EMPTY_DATA),
          'ERC1967InvalidImplementation',
          [anotherAccount],
        );
      });

      describe('when data is empty', function () {
        it('reverts when value is sent', async function () {
          await expectRevertCustomError(
            this.utils.$upgradeToAndCall(this.v2.address, EMPTY_DATA, { value: 1 }),
            'ERC1967NonPayable',
            [],
          );
        });
      });

      describe('when data is not empty', function () {
        it('delegates a call to the new implementation', async function () {
          const initializeData = this.v2.contract.methods.mockFunction().encodeABI();
          const receipt = await this.utils.$upgradeToAndCall(this.v2.address, initializeData);
          await expectEvent.inTransaction(receipt.tx, await V2.at(this.utils.address), 'MockFunctionCalled');
        });
      });
    });
  });

  describe('ADMIN_SLOT', function () {
    beforeEach('set admin', async function () {
      await setSlot(this.utils, AdminSlot, admin);
    });

    describe('getAdmin', function () {
      it('returns current admin and matches admin slot value', async function () {
        expect(await this.utils.$getAdmin()).to.equal(admin);
        expect(await getAddressInSlot(this.utils.address, AdminSlot)).to.equal(admin);
      });
    });

    describe('changeAdmin', function () {
      it('sets admin in storage and emits event', async function () {
        const newAdmin = anotherAccount;
        const receipt = await this.utils.$changeAdmin(newAdmin);

        expect(await getAddressInSlot(this.utils.address, AdminSlot)).to.equal(newAdmin);
        expectEvent(receipt, 'AdminChanged', { previousAdmin: admin, newAdmin: newAdmin });
      });

      it('reverts when setting the address zero as admin', async function () {
        await expectRevertCustomError(this.utils.$changeAdmin(ZERO_ADDRESS), 'ERC1967InvalidAdmin', [ZERO_ADDRESS]);
      });
    });
  });

  describe('BEACON_SLOT', function () {
    beforeEach('set beacon', async function () {
      this.beacon = await UpgradeableBeaconMock.new(this.v1.address);
      await setSlot(this.utils, BeaconSlot, this.beacon.address);
    });

    describe('getBeacon', function () {
      it('returns current beacon and matches beacon slot value', async function () {
        expect(await this.utils.$getBeacon()).to.equal(this.beacon.address);
        expect(await getAddressInSlot(this.utils.address, BeaconSlot)).to.equal(this.beacon.address);
      });
    });

    describe('upgradeBeaconToAndCall', function () {
      it('sets beacon in storage and emits event', async function () {
        const newBeacon = await UpgradeableBeaconMock.new(this.v2.address);
        const receipt = await this.utils.$upgradeBeaconToAndCall(newBeacon.address, EMPTY_DATA);

        expect(await getAddressInSlot(this.utils.address, BeaconSlot)).to.equal(newBeacon.address);
        expectEvent(receipt, 'BeaconUpgraded', { beacon: newBeacon.address });
      });

      it('reverts when beacon does not contain code', async function () {
        await expectRevertCustomError(
          this.utils.$upgradeBeaconToAndCall(anotherAccount, EMPTY_DATA),
          'ERC1967InvalidBeacon',
          [anotherAccount],
        );
      });

      it("reverts when beacon's implementation does not contain code", async function () {
        const newBeacon = await UpgradeableBeaconMock.new(anotherAccount);

        await expectRevertCustomError(
          this.utils.$upgradeBeaconToAndCall(newBeacon.address, EMPTY_DATA),
          'ERC1967InvalidImplementation',
          [anotherAccount],
        );
      });

      describe('when data is empty', function () {
        it('reverts when value is sent', async function () {
          const newBeacon = await UpgradeableBeaconMock.new(this.v2.address);
          await expectRevertCustomError(
            this.utils.$upgradeBeaconToAndCall(newBeacon.address, EMPTY_DATA, { value: 1 }),
            'ERC1967NonPayable',
            [],
          );
        });
      });

      describe('when data is not empty', function () {
        it('delegates a call to the new implementation', async function () {
          const initializeData = this.v2.contract.methods.mockFunction().encodeABI();
          const newBeacon = await UpgradeableBeaconMock.new(this.v2.address);
          const receipt = await this.utils.$upgradeBeaconToAndCall(newBeacon.address, initializeData);
          await expectEvent.inTransaction(receipt.tx, await V2.at(this.utils.address), 'MockFunctionCalled');
        });
      });

      describe('reentrant beacon implementation() call', function () {
        it('sees the new beacon implementation', async function () {
          const newBeacon = await UpgradeableBeaconReentrantMock.new();
          await expectRevertCustomError(
            this.utils.$upgradeBeaconToAndCall(newBeacon.address, '0x'),
            'BeaconProxyBeaconSlotAddress',
            [newBeacon.address],
          );
        });
      });
    });
  });
});
