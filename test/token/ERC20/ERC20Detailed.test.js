const { contract } = require('@openzeppelin/test-environment');
const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC20DetailedMock = contract.fromArtifact('ERC20DetailedMock');

describe('ERC20Detailed', function () {
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);

  beforeEach(async function () {
    this.detailedERC20 = await ERC20DetailedMock.new(_name, _symbol, _decimals);
  });

  it('has a name', async function () {
    expect(await this.detailedERC20.name()).to.equal(_name);
  });

  it('has a symbol', async function () {
    expect(await this.detailedERC20.symbol()).to.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    expect(await this.detailedERC20.decimals()).to.be.bignumber.equal(_decimals);
  });
});
