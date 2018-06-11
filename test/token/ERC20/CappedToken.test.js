import ether from '../../helpers/ether';
import shouldBehaveLikeMintableToken from './MintableToken.behaviour';
import shouldBehaveLikeCappedToken from './CappedToken.behaviour';

var CappedToken = artifacts.require('CappedToken');

contract('Capped', function ([owner, anotherAccount]) {
  const _cap = ether(1000);
  
  beforeEach(async function () {
    this.token = await CappedToken.new(_cap, { from: owner });
  });

  shouldBehaveLikeCappedToken([owner, anotherAccount, owner, _cap]);

  shouldBehaveLikeMintableToken([owner, anotherAccount, owner]);
});
