const { shouldBehaveLikeBurnableToken } = require('./BurnableToken.behavior');
const BurnableTokenMock = artifacts.require('BurnableTokenMock');

contract('BurnableToken', function ([_, owner, ...otherAccounts]) {
  const initialBalance = 1000;

  beforeEach(async function () {
    this.token = await BurnableTokenMock.new(owner, initialBalance, { from: owner });
  });

  shouldBehaveLikeBurnableToken(owner, initialBalance, otherAccounts);
});
