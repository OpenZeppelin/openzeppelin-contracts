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
    const amountOfUpdates = 10;
    const minFrequencyInBlocks = 1;
    const maxFrequencyInBlocks = 10;
    const reward = amount;

    this.contract = await Oracle.new(oracle, amountOfUpdates, minFrequencyInBlocks, maxFrequencyInBlocks, reward);
  });

  it('should reject activation if not sufficiently funded', async function () {
    await this.contract.activate().should.be.rejectedWith(EVMThrow);
  });

  it('should accept activation if sufficiently funded', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });
    await this.contract.activate({ from: owner });
    const isActive = await this.contract.isActive();
    isActive.should.be.equal(true);
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
    const valueOne = 1;
    const valueTwo = 2;

    await this.contract.addOracleData(valueOne, { from: oracle });
    let oracleData = await this.contract.getOracleData();
    oracleData[0].should.be.bignumber.equal(valueOne);

    await this.contract.addOracleData(valueTwo, { from: oracle });
    oracleData = await this.contract.getOracleData();
    oracleData[1].should.be.bignumber.equal(valueTwo);
  });

  it('should throw if called not by the oracle', async function () {
    const value = 1;
    await this.contract.addOracleData(value, { from: other }).should.be.rejectedWith(EVMThrow);
  });
});
