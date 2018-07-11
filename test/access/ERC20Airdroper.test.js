import shouldBehaveLikeERC20Airdroper from './ERC20Airdroper.behaviour';

const ERC20Airdroper = artifacts.require('ERC20Airdroper');
const MintableToken = artifacts.require('MintableToken');

contract('ERC20Airdroper', function ([owner, anotherAccount]) {
  const minter = owner;

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });
    this.airdroper = await ERC20Airdroper.new(this.token.address, { from: owner });
    await this.token.transferOwnership(this.airdroper.address);
  });

  shouldBehaveLikeERC20Airdroper([owner, anotherAccount, minter]);
});
