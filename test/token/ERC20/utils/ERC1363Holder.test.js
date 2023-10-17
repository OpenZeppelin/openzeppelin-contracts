const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const name = 'My Token';
const symbol = 'MTKN';
const value = 1000n;
const data = '0x123456';

async function fixture() {
  const [holder, spender] = await ethers.getSigners();
  const mock = await ethers.deployContract('$ERC1363Holder');
  const token = await ethers.deployContract('$ERC1363', [name, symbol]);
  await token.$_mint(holder, value);
  return {
    token,
    mock,
    holder,
    spender,
  };
}

describe('ERC1363Holder', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('receives ERC1363 token transfers', function () {
    beforeEach(async function () {
      expect(await this.token.balanceOf(this.holder)).to.be.equal(value);
      expect(await this.token.balanceOf(this.mock)).to.be.equal(0n);
    });

    afterEach(async function () {
      expect(await this.token.balanceOf(this.holder)).to.be.equal(0n);
      expect(await this.token.balanceOf(this.mock)).to.be.equal(value);
    });

    it('via transferAndCall', async function () {
      await expect(
        this.token.connect(this.holder).getFunction('transferAndCall(address,uint256,bytes)')(this.mock, value, data),
      )
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.mock.target, value);
    });

    it('via transferFromAndCall', async function () {
      await this.token.connect(this.holder).approve(this.spender, value);

      await expect(
        this.token.connect(this.spender).getFunction('transferFromAndCall(address,address,uint256,bytes)')(
          this.holder,
          this.mock,
          value,
          data,
        ),
      )
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.mock.target, value);
    });
  });

  describe('receives ERC1363 token approvals', function () {
    it('via approveAndCall', async function () {
      expect(await this.token.allowance(this.holder, this.mock)).to.be.equal(0n);

      await expect(
        this.token.connect(this.holder).getFunction('approveAndCall(address,uint256,bytes)')(this.mock, value, data),
      )
        .to.emit(this.token, 'Approval')
        .withArgs(this.holder.address, this.mock.target, value);

      expect(await this.token.allowance(this.holder, this.mock)).to.be.equal(value);
    });
  });
});
