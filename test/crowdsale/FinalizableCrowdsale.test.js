const { advanceBlock } = require('../helpers/advanceToBlock');
const { increaseTimeTo, duration } = require('../helpers/increaseTime');
const { latestTime } = require('../helpers/latestTime');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const FinalizableCrowdsale = artifacts.require('FinalizableCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken');

contract('FinalizableCrowdsale', function ([_, owner, wallet, thirdparty]) {
  const rate = new BigNumber(1000);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await latestTime()) + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await MintableToken.new();
    this.crowdsale = await FinalizableCrowdsale.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address, { from: owner }
    );
    await this.token.transferOwnership(this.crowdsale.address);
  });

  it('cannot be finalized before ending', async function () {
    await expectThrow(this.crowdsale.finalize({ from: owner }), EVMRevert);
  });

  it('cannot be finalized by third party after ending', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await expectThrow(this.crowdsale.finalize({ from: thirdparty }), EVMRevert);
  });

  it('can be finalized by owner after ending', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
  });

  it('cannot be finalized twice', async function () {
    await increaseTimeTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: owner });
    await expectThrow(this.crowdsale.finalize({ from: owner }), EVMRevert);
  });

  it('logs finalized', async function () {
    await increaseTimeTo(this.afterClosingTime);
    const { logs } = await this.crowdsale.finalize({ from: owner });
    const event = logs.find(e => e.event === 'Finalized');
    should.exist(event);
  });
});
