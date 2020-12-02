const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20PresetFixedSupply = artifacts.require('ERC20PresetFixedSupply');

contract('ERC20PresetFixedSupply', function (accounts) {
  const [deployer, owner] = accounts;

  const name = 'PresetFixedSupply';
  const symbol = 'PFS';

  const initialSupply = new BN('50000');
  const amount = new BN('10000');

  before(async function () {
    this.token = await ERC20PresetFixedSupply.new(name, symbol, initialSupply, owner, { from: deployer });
  });

  it('deployer has the balance equal to initial supply', async function () {
    expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(initialSupply);
  });

  it('total supply is equal to initial supply', async function () {
    expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
  });

  describe('burning', function () {
    it('holders can burn their tokens', async function () {
      const remainingBalance = initialSupply.sub(amount);
      const receipt = await this.token.burn(amount, { from: owner });
      expectEvent(receipt, 'Transfer', { from: owner, to: ZERO_ADDRESS, value: amount });
      expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(remainingBalance);
    });

    it('decrements totalSupply', async function () {
      const expectedSupply = initialSupply.sub(amount);
      expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
    });
  });
});
