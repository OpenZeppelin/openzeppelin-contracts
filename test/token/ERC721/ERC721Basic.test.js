const { shouldBehaveLikeERC721Basic } = require('./ERC721Basic.behavior');

const BigNumber = web3.BigNumber;
const ERC721Basic = artifacts.require('ERC721BasicMock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Basic', function ([_, creator, ...accounts]) {
  beforeEach(async function () {
    this.token = await ERC721Basic.new({ from: creator });
  });

  shouldBehaveLikeERC721Basic(creator, creator, accounts);
});
