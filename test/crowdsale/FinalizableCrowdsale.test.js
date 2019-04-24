const { BN, expectEvent, shouldFail, time } = require('openzeppelin-test-helpers');

const FinalizableCrowdsaleImpl = artifacts.require('FinalizableCrowdsaleImpl');
const ERC20 = artifacts.require('ERC20');

contract('FinalizableCrowdsale', function ([_, wallet, other]) {
  const rate = new BN('1000');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = (await time.latest()).add(time.duration.weeks(1));
    this.closingTime = this.openingTime.add(time.duration.weeks(1));
    this.afterClosingTime = this.closingTime.add(time.duration.seconds(1));

    this.token = await ERC20.new();
    this.crowdsale = await FinalizableCrowdsaleImpl.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address
    );
  });

  it('cannot be finalized before ending', async function () {
    await shouldFail.reverting.withMessage(this.crowdsale.finalize({ from: other }),
      'FinalizableCrowdsale: not closed'
    );
  });

  it('can be finalized by anyone after ending', async function () {
    await time.increaseTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: other });
  });

  it('cannot be finalized twice', async function () {
    await time.increaseTo(this.afterClosingTime);
    await this.crowdsale.finalize({ from: other });
    await shouldFail.reverting.withMessage(this.crowdsale.finalize({ from: other }),
      'FinalizableCrowdsale: already finalized'
    );
  });

  it('logs finalized', async function () {
    await time.increaseTo(this.afterClosingTime);
    const { logs } = await this.crowdsale.finalize({ from: other });
    expectEvent.inLogs(logs, 'CrowdsaleFinalized');
  });
});
