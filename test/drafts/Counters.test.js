const { BN } = require('openzeppelin-test-helpers');

const CountersImpl = artifacts.require('CountersImpl');

const EXPECTED = [new BN(1), new BN(2), new BN(3), new BN(4)];
const KEY1 = web3.utils.sha3('key1');
const KEY2 = web3.utils.sha3('key2');

contract('Counters', function ([_, owner]) {
  beforeEach(async function () {
    this.mock = await CountersImpl.new({ from: owner });
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
