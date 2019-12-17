const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { singletons } = require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC777Mintable } = require('./behaviors/ERC777Mintable.behavior');
const ERC777MintableMock = contract.fromArtifact('ERC777MintableMock');
const { shouldBehaveLikePublicRole } = require('../../behaviors/access/roles/PublicRole.behavior');

describe('ERC777Mintable', function () {
  const [ registryFunder, minter, otherMinter, defaultOperatorA, defaultOperatorB, ...otherAccounts ] = accounts;

  const name = 'ERC777MintableTest';
  const symbol = '777T';
  const data = web3.utils.sha3('OZ777TestData');
  const operatorData = web3.utils.sha3('OZ777TestOperatorData');

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await ERC777MintableMock.new(name, symbol, defaultOperators, { from: minter });
  });

  describe('minter role', function () {
    beforeEach(async function () {
      this.contract = this.token;
      await this.contract.addMinter(otherMinter, { from: minter });
    });

    shouldBehaveLikePublicRole(minter, otherMinter, otherAccounts, 'minter');
  });

  shouldBehaveLikeERC777Mintable(minter, data, operatorData, otherAccounts);
});
