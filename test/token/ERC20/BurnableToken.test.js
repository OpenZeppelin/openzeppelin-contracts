import shouldBehaveLikeBurnableToken from './BurnableToken.behaviour';
const BurnableTokenMock = artifacts.require('BurnableTokenMock');

contract('BurnableToken', function ([owner]) {
  const initialBalance = 1000;

  beforeEach(async function () {
    this.token = await BurnableTokenMock.new(owner, initialBalance);
  });

  shouldBehaveLikeBurnableToken([owner], initialBalance);
});
