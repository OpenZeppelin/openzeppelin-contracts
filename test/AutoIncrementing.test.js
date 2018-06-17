
const AutoIncrementing = artifacts.require('AutoIncrementingImpl');

require('chai')
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const EXPECTED = [1, 2, 3, 4];

contract('AutoIncrementing', function ([_, owner]) {
  beforeEach(async function () {
    this.mock = await AutoIncrementing.new({ from: owner });
  });

  it('should return expected values', async function () {
    for (let i = 0; i < EXPECTED.length; i++) {
      const expectedId = EXPECTED[i];
      await this.mock.doThing.sendTransaction({ from: owner });
      const actualId = await this.mock.theId();
      actualId.should.be.bignumber.eq(expectedId);
    }
  });
});
