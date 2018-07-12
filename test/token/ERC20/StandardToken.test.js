import shouldBehaveLikeStandardToken from './behaviors/StandardToken.behavior';

const StandardTokenMock = artifacts.require('StandardTokenMock');

contract('StandardToken', function ([_, owner, recipient, anotherAccount]) {
  beforeEach(async function () {
    this.token = await StandardTokenMock.new(owner, 100);
  });

  shouldBehaveLikeStandardToken([owner, recipient, anotherAccount]);
});
