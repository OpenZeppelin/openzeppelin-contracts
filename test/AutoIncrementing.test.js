import { hashMessage } from './helpers/sign';

const AutoIncrementing = artifacts.require('AutoIncrementingImpl');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const EXPECTED = [1, 2, 3, 4];
const key = hashMessage('custom');
const key2 = hashMessage('custom2');

contract('AutoIncrementing', function ([_, owner]) {
  beforeEach(async function () {
    this.mock = await AutoIncrementing.new({ from: owner });
  });

  context('default key', async function () {
    it('should return expected  values', async function () {
      for (let expectedId of EXPECTED) {
        await this.mock.doThingWithDefault({ from: owner });
        const actualId = await this.mock.theId();
        actualId.should.be.bignumber.eq(expectedId);
      }
    });
  });

  context('custom key', async function () {
    it('should return expected values', async function () {
      for (let expectedId of EXPECTED) {
        await this.mock.doThing(key, { from: owner });
        const actualId = await this.mock.theId();
        actualId.should.be.bignumber.eq(expectedId);
      }
    });
  });

  context('parallel keys', async function () {
    it('should return expected values for each counter', async function () {
      for (let expectedId of EXPECTED) {
        await this.mock.doThing(key, { from: owner });
        let actualId = await this.mock.theId();
        actualId.should.be.bignumber.eq(expectedId);

        await this.mock.doThing(key2, { from: owner });
        actualId = await this.mock.theId();
        actualId.should.be.bignumber.eq(expectedId);
      }
    });
  });
});
