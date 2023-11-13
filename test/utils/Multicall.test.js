const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const ERC20MulticallMock = '$ERC20MulticallMock';

async function fixture() {
  const [deployer, alice, bob] = await ethers.getSigners();

  const amount = 12000;
  const multicallToken = await ethers.deployContract(ERC20MulticallMock, ['name', 'symbol']);
  await multicallToken.$_mint(deployer, amount);

  return { deployer, alice, bob, amount, multicallToken };
}

describe('Multicall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('batches function calls', async function () {
    expect(await this.multicallToken.balanceOf(this.alice)).to.be.equal('0');
    expect(await this.multicallToken.balanceOf(this.bob)).to.be.equal('0');

    await this.multicallToken.multicall([
      this.multicallToken.interface.encodeFunctionData('transfer', [this.alice.address, this.amount / 2]),
      this.multicallToken.interface.encodeFunctionData('transfer', [this.bob.address, this.amount / 3]),
    ]);

    expect(await this.multicallToken.balanceOf(this.alice)).to.be.equal(this.amount / 2);
    expect(await this.multicallToken.balanceOf(this.bob)).to.be.equal(this.amount / 3);
  });

  it('returns an array with the result of each call', async function () {
    const MulticallMock = 'MulticallMock';
    const multicallMock = await ethers.deployContract(MulticallMock);
    await this.multicallToken.transfer(multicallMock, this.amount);
    expect(await this.multicallToken.balanceOf(multicallMock)).to.be.equal(this.amount);

    const recipients = [this.alice, this.bob];
    const amounts = [this.amount / 2, this.amount / 3];

    await multicallMock.checkReturnValues(this.multicallToken, recipients, amounts);
  });

  it('reverts previous calls', async function () {
    expect(await this.multicallToken.balanceOf(this.alice)).to.be.equal('0');

    const call = this.multicallToken.multicall([
      this.multicallToken.interface.encodeFunctionData('transfer', [this.alice.address, this.amount]),
      this.multicallToken.interface.encodeFunctionData('transfer', [this.bob.address, this.amount]),
    ]);

    await expect(call)
      .to.be.revertedWithCustomError(this.multicallToken, 'ERC20InsufficientBalance')
      .withArgs(this.deployer.address, 0, this.amount);
    expect(await this.multicallToken.balanceOf(this.alice)).to.be.equal('0');
  });

  it('bubbles up revert reasons', async function () {
    const call = this.multicallToken.multicall([
      this.multicallToken.interface.encodeFunctionData('transfer', [this.alice.address, this.amount]),
      this.multicallToken.interface.encodeFunctionData('transfer', [this.bob.address, this.amount]),
    ]);

    await expect(call)
      .to.be.revertedWithCustomError(this.multicallToken, 'ERC20InsufficientBalance')
      .withArgs(this.deployer.address, 0, this.amount);
  });
});
