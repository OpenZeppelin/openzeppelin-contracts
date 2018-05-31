const BigNumber = web3.BigNumber;
const EVMThrow = require('../helpers/EVMThrow.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Oracle = artifacts.require('Oracle');

contract('Oracle', function ([owner, oracle, other]) {
  const amount = web3.toWei(1.0, 'ether');

  beforeEach(async function () {
    this.contract = await Oracle.new(oracle, 10, 20, 30);
  });

  it('should accept funding the reward by the owner', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });

    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('should accept funding the reward by the external caller', async function () {
    await web3.eth.sendTransaction({ from: other, to: this.contract.address, value: amount });

    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('should accept updating the data only by the oracle', async function () {
    const key = 'keyOne';
    const value = 1;

    await this.contract.updateData(key, value, { from: oracle });
    const result = await this.contract.getData(key);
    result.should.be.bignumber.equal(value);
  });

  it('should throw if called not by the oracle', async function () {
    const key = 'keyOne';
    const value = 1;
    await this.contract.updateData(key, value, { from: other }).should.be.rejectedWith(EVMThrow);
  });
});
