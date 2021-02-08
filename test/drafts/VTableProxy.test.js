const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const VTableProxy = artifacts.require('VTableProxy');
const VTableOwnershipModule = artifacts.require('VTableOwnershipModule');
const VTableUpdateModule = artifacts.require('VTableUpdateModule');
const EtherReceiverMock = artifacts.require('EtherReceiverMock');

const extractSelectors = (abi) => [
  abi.find(({ type }) => type === 'receive') && '0x00000000',
  abi.find(({ type }) => type === 'fallback') && '0xffffffff',
  ...abi.filter(({ type }) => type === 'function').map(({ signature }) => signature),
].filter(Boolean);

contract('VTableProxy', function (accounts) {
  const [ admin, other ] = accounts;

  beforeEach('deploying', async function () {
    this.modules = {};
    this.modules.ownership = await VTableOwnershipModule.new();
    this.modules.update = await VTableUpdateModule.new();

    const { address } = await VTableProxy.new(this.modules.update.address, { from: admin });
    this.proxy = await VTableUpdateModule.at(address);
  });

  it('missing implementation', async function () {
    await expectRevert(this.proxy.send(), 'VTableProxy: No implementation found');
  });

  describe('vtable update', function () {
    it('authorized', async function () {
      const selectors = extractSelectors(this.modules.ownership.abi);
      const { receipt } = await this.proxy.updateVTable(
        [[ this.modules.ownership.address, selectors ]],
        { from: admin },
      );
      // events are not decoded :/
      expect(receipt.rawLogs.length).to.be.equal(selectors.length);
    });

    it('unauthorized', async function () {
      const selectors = extractSelectors(this.modules.ownership.abi);
      await expectRevert(
        this.proxy.updateVTable([[ this.modules.ownership.address, selectors ]], { from: other }),
        'VTableOwnership: caller is not the owner',
      );
    });

    it('empty update', async function () {
      const { receipt } = await this.proxy.updateVTable([], { from: admin });
      expect(receipt.rawLogs.length).to.be.equal(0);
    });

    it('receive', async function () {
      const receiver = await EtherReceiverMock.new();
      await this.proxy.updateVTable(
        [[ receiver.address, extractSelectors(receiver.abi) ]],
        { from: admin },
      );

      // does not accept eth
      await expectRevert.unspecified(this.proxy.send());
      // set accept eth
      await (await EtherReceiverMock.at(this.proxy.address)).setAcceptEther(true);
      // accept eth
      await this.proxy.send();
    });

    it('fallback', async function () {
      const receiver = await EtherReceiverMock.new();
      await this.proxy.updateVTable(
        [[ receiver.address, [ '0xffffffff' ] ]],
        { from: admin },
      );

      // does not accept eth
      await expectRevert.unspecified(this.proxy.send());
      // set accept eth
      await (await EtherReceiverMock.at(this.proxy.address)).setAcceptEther(true);
      // accept eth
      await this.proxy.send();
    });
  });

  describe('with ownership module', function () {
    beforeEach(async function () {
      await this.proxy.updateVTable(
        [[ this.modules.ownership.address, extractSelectors(this.modules.ownership.abi) ]],
        { from: admin },
      );
      this.instance = await VTableOwnershipModule.at(this.proxy.address);
    });

    it('has an owner', async function () {
      expect(await this.instance.owner()).to.equal(admin);
    });

    describe('transfer ownership', function () {
      it('changes owner after transfer', async function () {
        const receipt = await this.instance.transferOwnership(other, { from: admin });
        expectEvent(receipt, 'OwnershipTransferred');

        expect(await this.instance.owner()).to.equal(other);
      });

      it('prevents non-owners from transferring', async function () {
        await expectRevert(
          this.instance.transferOwnership(other, { from: other }),
          'VTableOwnership: caller is not the owner',
        );
      });

      it('guards ownership against stuck state', async function () {
        await expectRevert(
          this.instance.transferOwnership(constants.ZERO_ADDRESS, { from: admin }),
          'VTableOwnership: new owner is the zero address',
        );
      });
    });

    describe('renounce ownership', function () {
      it('loses owner after renouncement', async function () {
        const receipt = await this.instance.renounceOwnership({ from: admin });
        expectEvent(receipt, 'OwnershipTransferred');

        expect(await this.instance.owner()).to.equal(constants.ZERO_ADDRESS);
      });

      it('prevents non-owners from renouncement', async function () {
        await expectRevert(
          this.instance.renounceOwnership({ from: other }),
          'VTableOwnership: caller is not the owner',
        );
      });
    });
  });
});
