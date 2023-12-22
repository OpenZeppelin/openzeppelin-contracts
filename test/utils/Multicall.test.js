const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [holder, alice, bruce] = await ethers.getSigners();

  const amount = 12_000n;
  const helper = await ethers.deployContract('MulticallHelper');
  const mock = await ethers.deployContract('$ERC20MulticallMock', ['name', 'symbol']);
  await mock.$_mint(holder, amount);

  return { holder, alice, bruce, amount, mock, helper };
}

describe('Multicall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('batches function calls', async function () {
    expect(await this.mock.balanceOf(this.alice)).to.equal(0n);
    expect(await this.mock.balanceOf(this.bruce)).to.equal(0n);

    await expect(
      this.mock.multicall([
        this.mock.interface.encodeFunctionData('transfer', [this.alice.address, this.amount / 2n]),
        this.mock.interface.encodeFunctionData('transfer', [this.bruce.address, this.amount / 3n]),
      ]),
    )
      .to.emit(this.mock, 'Transfer')
      .withArgs(this.holder.address, this.alice.address, this.amount / 2n)
      .to.emit(this.mock, 'Transfer')
      .withArgs(this.holder.address, this.bruce.address, this.amount / 3n);

    expect(await this.mock.balanceOf(this.alice)).to.equal(this.amount / 2n);
    expect(await this.mock.balanceOf(this.bruce)).to.equal(this.amount / 3n);
  });

  it('returns an array with the result of each call', async function () {
    await this.mock.transfer(this.helper, this.amount);
    expect(await this.mock.balanceOf(this.helper)).to.equal(this.amount);

    await this.helper.checkReturnValues(this.mock, [this.alice, this.bruce], [this.amount / 2n, this.amount / 3n]);
  });

  it('reverts previous calls', async function () {
    expect(await this.mock.balanceOf(this.alice)).to.equal(0n);

    await expect(
      this.mock.multicall([
        this.mock.interface.encodeFunctionData('transfer', [this.alice.address, this.amount]),
        this.mock.interface.encodeFunctionData('transfer', [this.bruce.address, this.amount]),
      ]),
    )
      .to.be.revertedWithCustomError(this.mock, 'ERC20InsufficientBalance')
      .withArgs(this.holder.address, 0, this.amount);

    expect(await this.mock.balanceOf(this.alice)).to.equal(0n);
  });

  it('bubbles up revert reasons', async function () {
    await expect(
      this.mock.multicall([
        this.mock.interface.encodeFunctionData('transfer', [this.alice.address, this.amount]),
        this.mock.interface.encodeFunctionData('transfer', [this.bruce.address, this.amount]),
      ]),
    )
      .to.be.revertedWithCustomError(this.mock, 'ERC20InsufficientBalance')
      .withArgs(this.holder.address, 0, this.amount);
  });
});
