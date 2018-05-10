import shouldBehaveLikeERC721BasicToken from './ERC721BasicToken.behaviour';
import shouldSupportInterfaces from '../../introspection/SupportsInterface.behavior';
import shouldBehaveLikeERC721Token from './ERC721Token.behaviour';

const ERC721Token = artifacts.require('ERC721TokenMock.sol');

contract('ERC721Token', function ([_, owner, ...rest]) {
  beforeEach(async function () {
    this.name = 'Non Fungible Token';
    this.symbol = 'NFT';
    this.token = await ERC721Token.new(this.name, this.symbol, { from: owner });
  });

  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC721Exists',
    'ERC721Enumerable',
    'ERC721Metadata',
  ]);
  shouldBehaveLikeERC721BasicToken([owner, ...rest]);
  shouldBehaveLikeERC721Token([owner, ...rest]);
});
