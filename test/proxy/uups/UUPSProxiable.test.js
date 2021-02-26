const { expectRevert } = require('@openzeppelin/test-helpers');
const ethereumjsUtil = require('ethereumjs-util');

const DummyImplementation = artifacts.require('DummyImplementation');
const DummyImplementationProxiable = artifacts.require('DummyImplementationProxiable');
const DummyImplementationV2Proxiable = artifacts.require('DummyImplementationV2Proxiable');
const UUPSProxy = artifacts.require('UUPSProxy');

const UUPS_UUID = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

function toChecksumAddress (address) {
  return ethereumjsUtil.toChecksumAddress('0x' + address.replace(/^0x/, '').padStart(40, '0'));
}

contract('UUPSProxiable', function (accounts) {
  const [ proxyCreator ] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return UUPSProxy.new(implementation, initData, opts);
  };

  context('UUPS', function () {
    beforeEach(async function () {
      this.impl = await DummyImplementation.new();
      this.implproxiable = await DummyImplementationProxiable.new();
      this.implproxiablev2 = await DummyImplementationV2Proxiable.new();
      const { address } = await createProxy(this.implproxiable.address, undefined, '0x', { from: proxyCreator });
      this.dummy = new DummyImplementationProxiable(address);
    });

    it('check uuid', async function () {
      expect(await this.dummy.proxiableUUID()).to.be.equal(UUPS_UUID);
    });

    it('can update to proxiable', async function () {
      await this.dummy.updateCodeAddress(this.implproxiablev2.address);
      const implementation = toChecksumAddress((await web3.eth.getStorageAt(
        this.dummy.address,
        UUPS_UUID,
      )).substr(-40));
      expect(implementation).to.be.equal(this.implproxiablev2.address);
    });

    it('does not deploy with non-proxiable', async function () {
      this.skip(); // NOT SUPPORTED YET
      await expectRevert.unspecified(createProxy(this.impl.address, undefined, '0x', { from: proxyCreator }));
    });

    it('does not update to non-proxiable', async function () {
      await expectRevert.unspecified(this.dummy.updateCodeAddress(this.impl.address));
    });
  });
});
