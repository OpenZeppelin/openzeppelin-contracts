const BigNumber = web3.BigNumber;
const { EVMRevert } = require('../helpers/EVMRevert');
const { expectThrow } = require('../helpers/expectThrow');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Oracle = artifacts.require('Oracle');

contract('Oracle', function ([owner, oracle, other]) {
  const reward = web3.toWei(1.0, 'ether');
  const updatesNeeded = 3;

  beforeEach(async function () {
    this.contract = await Oracle.new(oracle, updatesNeeded, reward);
  });

  it('should reject contruction if amount of updates is wrong', async function () {
    const wrongUpdatesNeeded = 0;
    await expectThrow(Oracle.new(oracle, wrongUpdatesNeeded, reward),
      EVMRevert
    );
  });

  it('should reject contruction if reward is wrong', async function () {
    const wrongReward = 0;
    await expectThrow(Oracle.new(oracle, updatesNeeded, wrongReward), EVMRevert);
  });

  it('should reject canceling the reward if contract was not activated', async function () {
    await expectThrow(this.contract.cancelReward({ from: owner }), EVMRevert);
  });

  it('should reject activation if not sufficiently funded before the activation', async function () {
    await expectThrow(this.contract.activate(), EVMRevert);
  });

  it('should reject adding the data if contract is not activated yet', async function () {
    const value = 1;
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await expectThrow(this.contract.addOracleData(value, { from: oracle }), EVMRevert);
  });

  it('should accept funding the reward by the owner', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(reward);
  });

  it('should accept funding the reward by the external caller', async function () {
    await web3.eth.sendTransaction({ from: other, to: this.contract.address, value: reward });
    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(reward);
  });

  it('should reject claiming the reward if contract was not activated', async function () {
    await expectThrow(this.contract.claimReward({ from: oracle }), EVMRevert);
  });

  it('should accept activation if sufficiently funded', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    const isActive = await this.contract.isActive();
    isActive.should.be.equal(true);
  });

  it('should accept cancellation if oracle has not updated the data yet', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    const isActive = await this.contract.isActive();
    isActive.should.be.equal(true);
    this.contract.cancelReward({ from: owner });
    const isActiveAfterCancellation = await this.contract.isActive();
    isActiveAfterCancellation.should.be.equal(false);
  });

  it('should reject cancellation if oracle has updated the data required amount of times', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    const value = 1;
    await this.contract.addOracleData(value, { from: oracle });
    await this.contract.addOracleData(value, { from: oracle });
    await this.contract.addOracleData(value, { from: oracle });
    await expectThrow(this.contract.cancelReward({ from: owner }), EVMRevert);
  });

  it('should not allow to update the data more times than needed', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    const value = 1;
    await this.contract.addOracleData(value, { from: oracle });
    await this.contract.addOracleData(value, { from: oracle });
    await this.contract.addOracleData(value, { from: oracle });
    await expectThrow(this.contract.addOracleData(value, { from: oracle }), EVMRevert);
  });

  it('should reject double activation', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    const isActive = await this.contract.isActive();
    isActive.should.be.equal(true);
    await expectThrow(this.contract.activate({ from: owner }), EVMRevert);
  });

  it('should accept updating the data only by the oracle', async function () {
    const valueOne = 1;
    const valueTwo = 2;

    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });

    await this.contract.addOracleData(valueOne, { from: oracle });
    let oracleData = await this.contract.getOracleData();
    oracleData[0].should.be.bignumber.equal(valueOne);

    await this.contract.addOracleData(valueTwo, { from: oracle });
    oracleData = await this.contract.getOracleData();
    oracleData[1].should.be.bignumber.equal(valueTwo);
  });

  it('should reward the oracle if all updates happened properly', async function () {
    const value = 1;

    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    await this.contract.addOracleData(value, { from: oracle });
    await this.contract.addOracleData(value, { from: oracle });
    await this.contract.addOracleData(value, { from: oracle });

    const initialOracleBalance = web3.eth.getBalance(oracle);
    // claim reward by oracle after updating the data required three times
    await this.contract.claimReward({ from: oracle });

    const contractBalance = web3.eth.getBalance(this.contract.address);
    contractBalance.should.be.bignumber.equal(0);

    const oracleBalance = web3.eth.getBalance(oracle);
    oracleBalance.should.be.bignumber.not.equal(initialOracleBalance);

    const isActive = await this.contract.isActive();
    isActive.should.be.equal(false);
  });

  it('should reject claiming the reward if not updated enough times by oracle', async function () {
    const value = 1;
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    // update data only once (three times are required)
    await this.contract.addOracleData(value, { from: oracle });
    await expectThrow(this.contract.claimReward({ from: oracle }), EVMRevert);
  });

  it('should not allow adding data by anybody except oracle', async function () {
    const value = 1;
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: reward });
    await this.contract.activate({ from: owner });
    await expectThrow(this.contract.addOracleData(value, { from: other }), EVMRevert);
  });
});
