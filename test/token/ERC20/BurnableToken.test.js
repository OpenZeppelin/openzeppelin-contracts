import shouldBehaveLikeBurnableToken from './BurnableToken.behaviour';
const BurnableTokenMock = artifacts.require('BurnableTokenMock');

contract('BurnableToken', function ([owner]) {
  beforeEach(async function () {
    this.token = await BurnableTokenMock.new(owner, 1000);
  });

  shouldBehaveLikeBurnableToken([owner]);
});
