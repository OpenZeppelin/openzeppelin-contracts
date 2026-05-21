import { network } from 'hardhat';
import { expect } from 'chai';
import { CHAINS } from '../helpers/chains';
import { generators } from '../helpers/random';

const {
  ethers,
  helpers: { chain },
} = await network.create();

describe('CAIP utilities', function () {
  describe('CAIP-2', function () {
    before(async function () {
      this.mock = await ethers.deployContract('$CAIP2');
    });

    it('local()', async function () {
      await expect(this.mock.$local()).to.eventually.equal(chain.caip2);
    });

    for (const { namespace, reference, caip2 } of Object.values(CHAINS)) {
      it(`format(${namespace}, ${reference})`, async function () {
        await expect(this.mock.$format(namespace, reference)).to.eventually.equal(caip2);
      });

      it(`parse(${caip2})`, async function () {
        await expect(this.mock.$parse(caip2)).to.eventually.deep.equal([namespace, reference]);
      });
    }
  });

  describe('CAIP-10', function () {
    const account = generators.address();

    before(async function () {
      this.mock = await ethers.deployContract('$CAIP10');
    });

    it(`local(${account})`, async function () {
      const caip10 = chain.toCaip10(account);
      await expect(this.mock.$local(ethers.Typed.address(account))).to.eventually.equal(caip10);
    });

    for (const { caip2, toCaip10 } of Object.values(CHAINS)) {
      const caip10 = toCaip10(account);

      it(`format(${caip2}, ${account})`, async function () {
        await expect(this.mock.$format(ethers.Typed.string(caip2), ethers.Typed.string(account))).to.eventually.equal(
          caip10,
        );
      });

      it(`parse(${caip10})`, async function () {
        await expect(this.mock.$parse(caip10)).to.eventually.deep.equal([caip2, account]);
      });
    }
  });
});
