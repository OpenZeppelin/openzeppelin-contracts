import EVMRevert from '../../helpers/EVMRevert';

require('chai')
  .use(require('chai-as-promised'))
  .should();

const day = 3600 * 24;
const month = day * 30;

const MintableToken = artifacts.require('MintableToken');
const Vesting = artifacts.require('./VariableRateTokenVesting.sol');

// Utility helper functions.
async function addHoursOnEVM (hours) {
  const seconds = hours * 3600;
  await web3.currentProvider.send({
    jsonrpc: '2.0', method: 'evm_increaseTime', params: [seconds], id: 0,
  });
  await web3.currentProvider.send({
    jsonrpc: '2.0', method: 'evm_mine', params: [], id: 0,
  });
}

async function snapshotEVM () {
  await web3.currentProvider.send({
    jsonrpc: '2.0', method: 'evm_snapshot', params: [], id: 0,
  });
}

async function revertEVM () {
  await web3.currentProvider.send({
    jsonrpc: '2.0', method: 'evm_revert', params: [], id: 0,
  });
}

contract('VariableRateTokenVesting', async (accounts) => {
  let token;
  let vesting;
  const beneficiary = accounts[9];

  beforeEach(async () => {
    await snapshotEVM();
    token = await MintableToken.new();
    await token.mint(accounts[0], 100000);
  });

  afterEach(async () => {
    await revertEVM();
  });

  it('should validate contructor args', async () => {
    // Invalid.
    await Vesting.new(beneficiary, 0, 0, true, [0, 10, 100, 200], 1)
      .should.be.rejectedWith(EVMRevert);
    await Vesting.new(beneficiary, 0, 0, true, [20, 10, 100], 1)
      .should.be.rejectedWith(EVMRevert);
    // Valid.
    await Vesting.new(beneficiary, 0, 0, true, [0, 100], 1);
    await Vesting.new(beneficiary, 0, 0, true, [0, 10, 20, 30, 30, 30, 100], 1);
  });

  it('should calculate vested amount correctly - case 1', async () => {
    const currTs = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    vesting = await Vesting.new(beneficiary, currTs, day, true, [50, 100], month);
    await token.transfer(vesting.address, 8888);
    // Before start, expect zero.
    let amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 0);
    // First period.
    await addHoursOnEVM(25); // One day later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 4444);
    await addHoursOnEVM(24 * 15); // In total 16 days later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 4444);
    // Second period and after.
    await addHoursOnEVM(24 * 20); // In total 36 days later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 8888);
    await addHoursOnEVM(24 * 50); // In total 86 days later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 8888);
  });

  it('should calculate vested amount correctly - case 2', async () => {
    const currTs = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    vesting = await Vesting.new(beneficiary, currTs, day, true, [10, 20, 40, 60, 60, 100], month);
    await token.transfer(vesting.address, 10000);
    // Before start, expect zero.
    let amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 0);
    // First period.
    await addHoursOnEVM(25); // One day later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 1000);
    // Second period.
    await addHoursOnEVM(24 * 31); // In total 32 days later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 2000);
    // Third period.
    await addHoursOnEVM(24 * 31); // In total 63 days (2mo) later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 4000);
    // Forth period.
    await addHoursOnEVM(24 * 31); // In total 94 days (3mo) later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 6000);
    // Fifth period.
    await addHoursOnEVM(24 * 31); // In total 125 days (4mo) later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 6000); // Same vesting amount as last period.
    // Last period.
    await addHoursOnEVM(24 * 31); // In total 156 days (5mo) later.
    amount = await vesting.vestedAmount(token.address);
    assert.equal(amount.toNumber(), 10000);
  });

  it('should release amount accordingly', async () => {
    const currTs = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    vesting = await Vesting.new(beneficiary, currTs, day, true, [50, 100], month);
    await token.transfer(vesting.address, 8888);
    // First period.
    await addHoursOnEVM(25); // One day later.
    await vesting.release(token.address);
    let amount = await token.balanceOf(beneficiary);
    assert.equal(amount.toNumber(), 4444);
    // Second period and after.
    await addHoursOnEVM(24 * 31); // 1mo day later.
    await vesting.release(token.address);
    amount = await token.balanceOf(beneficiary);
    assert.equal(amount.toNumber(), 8888);
  });
});
