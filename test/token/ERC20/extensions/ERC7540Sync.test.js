import { network } from 'hardhat';
import { expect } from 'chai';

const { ethers } = await network.create();

const name = 'Vault Shares';
const symbol = 'vSHR';
const tokenName = 'Asset Token';
const tokenSymbol = 'AST';

describe('ERC7540Sync', function () {
  before(function () {
    this.ethers = ethers;
  });

  it('construction fails if no async mechanism is enabled', async function () {
    const token = await ethers.deployContract('$ERC20', [tokenName, tokenSymbol]);
    const factory = await ethers.getContractFactory('$ERC7540SyncMock');

    await expect(ethers.deployContract('$ERC7540SyncMock', [name, symbol, token])).to.be.revertedWithCustomError(
      factory,
      'ERC7540MissingAsync',
    );
  });
});
