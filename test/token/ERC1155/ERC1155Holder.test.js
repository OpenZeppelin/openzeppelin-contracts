const { BN } = require('@openzeppelin/test-helpers');

const ERC1155Holder = artifacts.require('ERC1155Holder');
const ERC1155Mock = artifacts.require('ERC1155Mock');

const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');

contract('ERC1155Holder', function (accounts) {
  const [creator] = accounts;
  const uri = 'https://token-cdn-domain/{id}.json';
  const multiTokenIds = [new BN(1), new BN(2), new BN(3)];
  const multiTokenAmounts = [new BN(1000), new BN(2000), new BN(3000)];
  const transferData = '0x12345678';

  beforeEach(async function () {
    this.multiToken = await ERC1155Mock.new(uri, { from: creator });
    this.holder = await ERC1155Holder.new();
    await this.multiToken.mintBatch(creator, multiTokenIds, multiTokenAmounts, '0x', { from: creator });
  });

  shouldSupportInterfaces(['ERC165', 'ERC1155Receiver']);

  it('receives ERC1155 tokens from a single ID', async function () {
    await this.multiToken.safeTransferFrom(
      creator,
      this.holder.address,
      multiTokenIds[0],
      multiTokenAmounts[0],
      transferData,
      { from: creator },
    );

    expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[0]))
      .to.be.bignumber.equal(multiTokenAmounts[0]);

    for (let i = 1; i < multiTokenIds.length; i++) {
      expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[i])).to.be.bignumber.equal(new BN(0));
    }
  });

  it('receives ERC1155 tokens from a multiple IDs', async function () {
    for (let i = 0; i < multiTokenIds.length; i++) {
      expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[i])).to.be.bignumber.equal(new BN(0));
    };

    await this.multiToken.safeBatchTransferFrom(
      creator,
      this.holder.address,
      multiTokenIds,
      multiTokenAmounts,
      transferData,
      { from: creator },
    );

    for (let i = 0; i < multiTokenIds.length; i++) {
      expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[i]))
        .to.be.bignumber.equal(multiTokenAmounts[i]);
    }
  });
});
