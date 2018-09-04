const { shouldBehaveLikeERC721Full } = require('./ERC721Full.behavior');
const { shouldBehaveLikeERC721Basic } = require('./ERC721Basic.behavior');
const {
  shouldBehaveLikeMintAndBurnERC721,
} = require('./ERC721MintBurn.behavior');
const {
  shouldSupportInterfaces,
} = require('../../introspection/SupportsInterface.behavior');
const _ = require('lodash');

const BigNumber = web3.BigNumber;
const ERC721 = artifacts.require('ERC721Mock.sol');

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721', function ([
  creator,
  minter,
  ...accounts
]) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721.new(name, symbol, [minter], { from: creator });
  });

  shouldBehaveLikeERC721Basic(creator, minter, accounts);
  shouldBehaveLikeMintAndBurnERC721(creator, minter, accounts);
  shouldBehaveLikeERC721Full(name, symbol, creator, minter, accounts);

  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC721Enumerable',
    'ERC721Metadata',
  ]);
});
