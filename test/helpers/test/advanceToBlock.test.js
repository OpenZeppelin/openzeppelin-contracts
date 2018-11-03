const advanceToBlock = require('../advanceToBlock');

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

describe('advanceToBlock', function () {
  beforeEach(function () {
    this.startingBlock = web3.eth.blockNumber;
  });

  describe('advanceBlock', function () {
    it('increases the block number by one', async function () {
      await advanceToBlock.advanceBlock();
      web3.eth.blockNumber.should.be.bignumber.equal(this.startingBlock + 1);
    });
  });
});
