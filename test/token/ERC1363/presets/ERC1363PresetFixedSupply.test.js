const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC1363PresetFixedSupply = artifacts.require('ERC1363PresetFixedSupply');

contract('ERC1363PresetFixedSupply', function (accounts) {
  const [deployer, owner] = accounts;

  const name = 'ERC1363 Preset';
  const symbol = '1363P';

  const initialSupply = new BN('50000');

  before(async function () {
    this.token = await ERC1363PresetFixedSupply.new(name, symbol, initialSupply, owner, { from: deployer });
  });

  it('returns the name', async function () {
    expect(await this.token.name()).to.equal(name);
  });

  it('returns the symbol', async function () {
    expect(await this.token.symbol()).to.equal(symbol);
  });

  it('deployer has the balance equal to initial supply', async function () {
    expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialSupply);
  });

  it('total supply is equal to initial supply', async function () {
    expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
  });
});
