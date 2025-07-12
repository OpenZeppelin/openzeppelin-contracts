const { ethers } = require('hardhat');
const { expect } = require('chai');

const { CHAINS, getLocalChain } = require('../helpers/chains');

describe('CAIP utilities', function () {
  before(async function () {
    this.local = await getLocalChain();
  });

  describe('CAIP-2', function () {
    before(async function () {
      this.mock = await ethers.deployContract('$CAIP2');
    });

    it('local()', async function () {
      const { caip2 } = this.local;
      expect(await this.mock.$local()).to.equal(caip2);
    });

    for (const { namespace, reference, caip2 } of Object.values(CHAINS)) {
      it(`format(${namespace}, ${reference})`, async function () {
        expect(await this.mock.$format(namespace, reference)).to.equal(caip2);
      });

      it(`parse(${caip2})`, async function () {
        expect(await this.mock.$parse(caip2)).to.deep.equal([namespace, reference]);
      });
    }
  });

  describe('CAIP-10', function () {
    const { address: account } = ethers.Wallet.createRandom();

    before(async function () {
      this.mock = await ethers.deployContract('$CAIP10');
    });

    it(`local(${account})`, async function () {
      const caip10 = this.local.toCaip10(account);
      expect(await this.mock.$local(ethers.Typed.address(account))).to.equal(caip10);
    });

    for (const { caip2, toCaip10 } of Object.values(CHAINS)) {
      const caip10 = toCaip10(account);

      it(`format(${caip2}, ${account})`, async function () {
        expect(await this.mock.$format(ethers.Typed.string(caip2), ethers.Typed.string(account))).to.equal(caip10);
      });

      it(`parse(${caip10})`, async function () {
        expect(await this.mock.$parse(caip10)).to.deep.equal([caip2, account]);
      });
    }
  });
});
