const { expectRevert } = require('@openzeppelin/test-helpers');
const ethereumjsUtil = require('ethereumjs-util');

const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const DummyImplementation = artifacts.require('DummyImplementation')
const DummyImplementationProxiable = artifacts.require('DummyImplementationProxiable')
const DummyImplementationV2Proxiable = artifacts.require('DummyImplementationV2Proxiable')
const UUPSProxy = artifacts.require('UUPSProxy');

const UUPS_UUID = '0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7';

function toChecksumAddress (address) {
  return ethereumjsUtil.toChecksumAddress('0x' + address.replace(/^0x/, '').padStart(40, '0'));
}

contract('UUPSProxy', function (accounts) {
  const [ proxyCreator ] = accounts;

  const createProxy = async function (implementation, _admin, initData, opts) {
    return UUPSProxy.new(implementation, initData, opts);
  };

  shouldBehaveLikeProxy(createProxy, undefined, proxyCreator, {
    artefact: DummyImplementationProxiable,
    slot: UUPS_UUID,
  });

  context('UUPS', function () {
    beforeEach(async function () {
      this.implementation = await DummyImplementation.new();
      this.implementationproxiable = await DummyImplementationProxiable.new();
      this.implementationproxiablev2 = await DummyImplementationV2Proxiable.new();
      const { address } = await createProxy(this.implementationproxiable.address, undefined, '0x', { from: proxyCreator });
      this.dummy = new DummyImplementationProxiable(address);
    });

    it('check uuid', async function() {
      expect(await this.dummy.proxiableUUID()).to.be.equal(UUPS_UUID);
    });

    it('can update to proxiable', async function() {
      await this.dummy.updateCodeAddress(this.implementationproxiablev2.address);
      const implementation = toChecksumAddress((await web3.eth.getStorageAt(this.dummy.address, UUPS_UUID)).substr(-40));
      expect(implementation).to.be.equal(this.implementationproxiablev2.address);
    });

    it('does not deploy with non-proxiable', async function() {
      await expectRevert.unspecified(createProxy(this.implementation.address, undefined, '0x', { from: proxyCreator }));
    });

    it('does not update to non-proxiable', async function() {
      await expectRevert.unspecified(this.dummy.updateCodeAddress(this.implementation.address));
    });
  });
});
