const { BN, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC1363Holder = artifacts.require('$ERC1363Holder');
const ERC1363 = artifacts.require('$ERC1363');

contract('ERC1363Holder', function (accounts) {
  const [owner, spender] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';
  const balance = new BN(100);

  beforeEach(async function () {
    this.token = await ERC1363.new(name, symbol);
    this.receiver = await ERC1363Holder.new();

    await this.token.$_mint(owner, balance);
  });

  describe('receives ERC1363 token transfers', function () {
    it('via transferAndCall', async function () {
      const receipt = await this.token.methods['transferAndCall(address,uint256)'](this.receiver.address, balance, {
        from: owner,
      });

      expectEvent(receipt, 'Transfer', { from: owner, to: this.receiver.address, value: balance });

      expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('0');
      expect(await this.token.balanceOf(this.receiver.address)).to.be.bignumber.equal(balance);
    });

    it('via transferFromAndCall', async function () {
      await this.token.approve(spender, balance, { from: owner });

      const receipt = await this.token.methods['transferFromAndCall(address,address,uint256)'](
        owner,
        this.receiver.address,
        balance,
        {
          from: spender,
        },
      );

      expectEvent(receipt, 'Transfer', { from: owner, to: this.receiver.address, value: balance });

      expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('0');
      expect(await this.token.balanceOf(this.receiver.address)).to.be.bignumber.equal(balance);
    });
  });

  describe('receives ERC1363 token approvals', function () {
    it('via approveAndCall', async function () {
      const receipt = await this.token.methods['approveAndCall(address,uint256)'](this.receiver.address, balance, {
        from: owner,
      });

      expectEvent(receipt, 'Approval', { owner, spender: this.receiver.address, value: balance });

      expect(await this.token.allowance(owner, this.receiver.address)).to.be.bignumber.equal(balance);
    });
  });
});
