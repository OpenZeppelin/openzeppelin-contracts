
const CounterImpl = artifacts.require('CounterImpl');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const EXPECTED = [1, 2, 3, 4];
const KEY1 = web3.sha3('key1');
const KEY2 = web3.sha3('key2');

contract('Counter', function ([_, owner]) {
  beforeEach(async function () {
    this.mock = await CounterImpl.new({ from: owner });
  });

  context('custom key', async function () {
    it('should return expected values', async function () {
      for (const expectedId of EXPECTED) {
        await this.mock.doThing(KEY1, { from: owner });
        const actualId = await this.mock.theId();
        actualId.should.be.bignumber.equal(expectedId);
      }
    });
  });

  context('parallel keys', async function () {
    it('should return expected values for each counter', async function () {
      for (const expectedId of EXPECTED) {
        await this.mock.doThing(KEY1, { from: owner });
        let actualId = await this.mock.theId();
        actualId.should.be.bignumber.equal(expectedId);

        await this.mock.doThing(KEY2, { from: owner });
        actualId = await this.mock.theId();
        actualId.should.be.bignumber.equal(expectedId);
      }
    });
  });
});
