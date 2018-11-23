const { ether } = require('../ether');

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

describe('ether', function () {
  it('returns a BigNumber', function () {
    ether(1, 'ether').should.be.bignumber.equal(new BigNumber(1000000000000000000));
  });

  it('works with negative amounts', function () {
    ether(-1, 'ether').should.be.bignumber.equal(new BigNumber(-1000000000000000000));
  });
});
