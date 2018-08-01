const { ether } = require('../../helpers/ether');
const { shouldBehaveLikeMintableToken } = require('./MintableToken.behaviour');
const { shouldBehaveLikeCappedToken } = require('./CappedToken.behaviour');

const CappedToken = artifacts.require('CappedToken');

contract('Capped', function ([owner, anotherAccount]) {
  const _cap = ether(1000);

  beforeEach(async function () {
    this.token = await CappedToken.new(_cap, { from: owner });
  });

  shouldBehaveLikeCappedToken([owner, anotherAccount, owner, _cap]);

  shouldBehaveLikeMintableToken([owner, anotherAccount, owner]);
});
