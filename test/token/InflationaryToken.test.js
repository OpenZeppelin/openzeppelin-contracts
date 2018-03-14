import assertRevert from '../helpers/assertRevert';

const InflationaryTokenMock = artifacts.require('InflationaryTokenMock.sol');
const BigNumber = web3.BigNumber;

contract('InflationaryToken', function (accounts) {
  const hours = 6;
  const totalaSupply = new BigNumber(14 * 1e18);
  const yearlyInflation = 0.1;
  let hourlyInflation = (1 + yearlyInflation) ** (1 / (365 * 24));
  // round rate to 15 significant digits
  hourlyInflation = new BigNumber(Math.round(hourlyInflation * 1e14) / 1e14);
  const inflationRateBig = hourlyInflation.mul(1e18);

  before(async function () {
    this.token = await InflationaryTokenMock.new(hours, totalaSupply, inflationRateBig);
  });

  it('should return correct interval since last update', async function () {
    const timeInterval = await this.token.intervalsSinceLastInflationUpdate.call();
    assert.equal(timeInterval, hours, 'Time interval should match mock');
  });

  it('should throw when non owner attempts to mint tokens', async function () {
    await assertRevert(this.token.mintTokens(accounts[1], { from: accounts[1] }));
  });

  it('should mint inflation coin correctly', async function () {
    const contractOwner = accounts[0];
    const startSupply = await this.token.totalSupply.call();

    const result = await this.token.mintTokens(contractOwner);
    console.log('inflation gas ', result.receipt.gasUsed);

    const endBalanceAcc1 = await this.token.balanceOf.call(contractOwner);
    const endSupply = await this.token.totalSupply.call();
    const endBalanceShouldBe = totalaSupply.mul(hourlyInflation.pow(hours));

    // .toNumber() is ok here because results will be a little different anyway
    assert.equal(endBalanceShouldBe.toNumber(), endSupply.toNumber(), 'Results should be close to js computation');
    assert.isAbove(endSupply, startSupply, 'End supply should be greater than start supply');
    assert.equal(endSupply.toNumber(), endBalanceAcc1.toNumber(), 'Should disburse amount to user correctly');
  });

  it('should throw when time period is less than 1 hour', async function () {
    const contractOwner = accounts[0];
    await assertRevert(this.token.mintTokens(contractOwner));
  });
});
