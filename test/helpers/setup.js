const chai = require('chai');

module.exports = {
  should: function () {
    return require('chai').should();
  },
  BigNumber: function (bignumber) {
    return chai.use(require('chai-bignumber')(bignumber));
  },
  shouldWithBigNumber: function (bignumber) {
    return chai.use(require('chai-bignumber')(bignumber)).should();
  },
};
