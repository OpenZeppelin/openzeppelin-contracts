import increaseTime from '../helpers/increaseTime';
const BigNumber = web3.BigNumber;
const EVMThrow = require('../helpers/EVMThrow.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Oracle = artifacts.require('Oracle');

contract('Oracle', function ([owner, oracle, other]) {
  const amount = web3.toWei(1.0, 'ether');
  const amountOfUpdates = 3;
  // 24h
  const minFrequencyInSeconds = 60 * 60 * 24;
  // 25h
  const maxFrequencyInSeconds = 60 * 60 * 24 + 60 * 60;

  beforeEach(async function () {
    this.contract = await Oracle.new(oracle, amountOfUpdates, minFrequencyInSeconds, maxFrequencyInSeconds, amount);
  });

  it('should reject contruction if amount of update is wrong', async function () {
    const wrongAmountOfUpdates = 0;
    await Oracle.new(oracle,
      wrongAmountOfUpdates,
      minFrequencyInSeconds,
      maxFrequencyInSeconds,
      amount).should.be.rejectedWith(EVMThrow);
  });

  it('should reject contruction if min frequency is wrong', async function () {
    const wrongMinFrequency = 0;
    await Oracle.new(oracle,
      amountOfUpdates,
      wrongMinFrequency,
      maxFrequencyInSeconds,
      amount).should.be.rejectedWith(EVMThrow);
  });

  it('should reject contruction if max frequency is wrong', async function () {
    const wrongMaxFrequency = 0;
    await Oracle.new(oracle,
      amountOfUpdates,
      minFrequencyInSeconds,
      wrongMaxFrequency,
      amount).should.be.rejectedWith(EVMThrow);
  });

  it('should reject contruction if reward is wrong', async function () {
    const wrongReward = 0;
    await Oracle.new(oracle,
      amountOfUpdates,
      minFrequencyInSeconds,
      maxFrequencyInSeconds,
      wrongReward).should.be.rejectedWith(EVMThrow);
  });

  it('should reject contruction if max frequency is less than a minimum', async function () {
    const minFrequency = 10;
    const maxFrequency = 1;
    await Oracle.new(oracle, amountOfUpdates, minFrequency, maxFrequency, amount).should.be.rejectedWith(EVMThrow);
  });

  it('should reject canceling the reward if contract was not activated', async function () {
    await this.contract.cancelReward({ from: oracle }).should.be.rejectedWith(EVMThrow);
  });

  it('should reject activation if not sufficiently funded during the activation', async function () {
    await this.contract.activate().should.be.rejectedWith(EVMThrow);
  });

  it('should reject claiming the reward if contract was not activated', async function () {
    await this.contract.claimReward({ from: oracle }).should.be.rejectedWith(EVMThrow);
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

  it('should reject updating the data if updated too frequently', async function () {
    const valueOne = 1;
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });
    await this.contract.activate({ from: owner });
    await this.contract.addOracleData(valueOne, { from: oracle }).should.be.rejectedWith(EVMThrow);
  });

  it('should reject updating the data if updated too late', async function () {
    const valueOne = 1;

    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });
    await this.contract.activate({ from: owner });
    increaseTime(2 * 60 * 60 * 24 + 1);
    await this.contract.addOracleData(valueOne, { from: oracle }).should.be.rejectedWith(EVMThrow);
  });

  it('should accept updating the data only by the oracle and according to the frequency rules', async function () {
    const valueOne = 1;
    const valueTwo = 2;

    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });
    await this.contract.activate({ from: owner });

    increaseTime(60 * 60 * 24 + 1);

    await this.contract.addOracleData(valueOne, { from: oracle });

    let oracleData = await this.contract.getOracleData();
    oracleData[0].should.be.bignumber.equal(valueOne);

    increaseTime(60 * 60 * 24 + 1);

    await this.contract.addOracleData(valueTwo, { from: oracle });
    oracleData = await this.contract.getOracleData();
    oracleData[1].should.be.bignumber.equal(valueTwo);
  });

  it('should reward the oracle if all updates happened properly', async function () {
    const value = 1;

    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });
    await this.contract.activate({ from: owner });

    increaseTime(60 * 60 * 24 + 1);
    await this.contract.addOracleData(value, { from: oracle });

    increaseTime(60 * 60 * 24 + 1);
    await this.contract.addOracleData(value, { from: oracle });

    increaseTime(60 * 60 * 24 + 1);
    await this.contract.addOracleData(value, { from: oracle });

    const initialOracleBalance = web3.eth.getBalance(oracle);

    // claim reward by oracle
    await this.contract.claimReward({ from: oracle });

    const contractBalance = web3.eth.getBalance(this.contract.address);
    contractBalance.should.be.bignumber.equal(0);

    const oracleBalance = web3.eth.getBalance(oracle);
    oracleBalance.should.be.bignumber.not.equal(initialOracleBalance);

    const isActive = await this.contract.isActive();
    isActive.should.be.equal(false);
  });

  it('should allow owner to cancel the reward if oracle violated the frequency', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });
    await this.contract.activate({ from: owner });

    // time is violated - no updates came
    increaseTime(60 * 60 * 24 + 60 * 60 * 24);

    await this.contract.cancelReward({ from: owner });
    const contractBalance = web3.eth.getBalance(this.contract.address);
    contractBalance.should.be.bignumber.equal(0);
  });

  it('should throw is updated more frequently than allowed', async function () {
    const valueOne = 1;
    // 1 day minus one second
    increaseTime(60 * 60 * 24 - 1);
    await this.contract.addOracleData(valueOne, { from: oracle }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw is updated less frequently than allowed', async function () {
    const valueOne = 1;
    // 2 days
    increaseTime(60 * 60 * 24 * 2);
    await this.contract.addOracleData(valueOne, { from: oracle }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if called not by the oracle', async function () {
    const value = 1;
    await this.contract.addOracleData(value, { from: other }).should.be.rejectedWith(EVMThrow);
  });
});
