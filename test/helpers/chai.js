const chai = require('chai');

module.exports = {
  shouldWithBignumber: function (bignumber) {
    return chai.use(require('chai-bignumber')(bignumber)).should();
  },
  shouldOnly: function () {
    return require('chai').should();
  },
};
