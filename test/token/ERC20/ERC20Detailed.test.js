const { BN } = require('openzeppelin-test-helpers');

const ERC20DetailedMock = artifacts.require('ERC20DetailedMock');
const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');

contract('ERC20Detailed', function () {
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);

  beforeEach(async function () {
    this.token = await ERC20DetailedMock.new(_name, _symbol, _decimals);
  });

  it('has a name', async function () {
    (await this.token.name()).should.be.equal(_name);
  });

  it('has a symbol', async function () {
    (await this.token.symbol()).should.be.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    (await this.token.decimals()).should.be.bignumber.equal(_decimals);
  });

  shouldSupportInterfaces([
    'ERC165',
    'ERC20Detailed',
  ]);
});
