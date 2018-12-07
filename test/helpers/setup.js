const chai = require('chai');

const BigNumber = web3.BigNumber;
const should = chai.use(require('chai-bignumber')(BigNumber)).should();

module.exports = {
  BigNumber,
  should,
};
