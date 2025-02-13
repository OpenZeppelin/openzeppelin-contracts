const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { CHAINS, getLocalCAIP } = require('../helpers/chains');

async function fixture() {
  const caip2 = await ethers.deployContract('$CAIP2');
  const caip10 = await ethers.deployContract('$CAIP10');
  return { caip2, caip10 };
}

describe('CAIP utilities', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('CAIP-2', function () {
    it('local()', async function () {
      const { caip2 } = await getLocalCAIP();
      expect(await this.caip2.$local()).to.equal(caip2);
    });

    for (const { namespace, reference, caip2 } of Object.values(CHAINS))
      it(`format(${namespace}, ${reference})`, async function () {
        expect(await this.caip2.$format(namespace, reference)).to.equal(caip2);
      });

    for (const { namespace, reference, caip2 } of Object.values(CHAINS))
      it(`parse(${caip2})`, async function () {
        expect(await this.caip2.$parse(caip2)).to.deep.equal([namespace, reference]);
      });
  });

  describe('CAIP-10', function () {
    const { address: account } = ethers.Wallet.createRandom();

    it(`local(${account})`, async function () {
      const { caip10 } = await getLocalCAIP(account);
      expect(await this.caip10.$local(ethers.Typed.address(account))).to.equal(caip10);
    });

    for (const { account, caip2, caip10 } of Object.values(CHAINS))
      it(`format(${caip2}, ${account})`, async function () {
        expect(await this.caip10.$format(ethers.Typed.string(caip2), ethers.Typed.string(account))).to.equal(caip10);
      });

    for (const { account, caip2, caip10 } of Object.values(CHAINS))
      it(`parse(${caip10})`, async function () {
        expect(await this.caip10.$parse(caip10)).to.deep.equal([caip2, account]);
      });
  });
});
