require('../../helpers/setup');

const ERC20DetailedMock = artifacts.require('ERC20DetailedMock');

contract('ERC20Detailed', function () {
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = 18;

  beforeEach(async function () {
    this.detailedERC20 = await ERC20DetailedMock.new(_name, _symbol, _decimals);
  });

  it('has a name', async function () {
    (await this.detailedERC20.name()).should.be.equal(_name);
  });

  it('has a symbol', async function () {
    (await this.detailedERC20.symbol()).should.be.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    (await this.detailedERC20.decimals()).should.be.bignumber.equal(_decimals);
  });
});
