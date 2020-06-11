const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN } = require('@openzeppelin/test-helpers');

const ERC1155Holder = contract.fromArtifact('ERC1155Holder');
const ERC1155Mock = contract.fromArtifact('ERC1155Mock');

const { expect } = require('chai');

describe('ERC1155Holder', function () {
  const [creator] = accounts;

  it('receives ERC1155 tokens', async function () {
    const uri = 'https://token-cdn-domain/{id}.json';

    const multiToken = await ERC1155Mock.new(uri, { from: creator });
    const multiTokenIds = [new BN(1), new BN(2), new BN(3)];
    const multiTokenAmounts = [new BN(1000), new BN(2000), new BN(3000)];
    await multiToken.mintBatch(creator, multiTokenIds, multiTokenAmounts, '0x', { from: creator });

    const transferData = '0xf00dbabe';

    const holder = await ERC1155Holder.new();

    await multiToken.safeTransferFrom(
      creator,
      holder.address,
      multiTokenIds[0],
      multiTokenAmounts[0],
      transferData,
      { from: creator },
    );

    expect(await multiToken.balanceOf(holder.address, multiTokenIds[0])).to.be.bignumber.equal(multiTokenAmounts[0]);

    await multiToken.safeBatchTransferFrom(
      creator,
      holder.address,
      multiTokenIds.slice(1),
      multiTokenAmounts.slice(1),
      transferData,
      { from: creator },
    );

    for (let i = 1; i < multiTokenIds.length; i++) {
      expect(await multiToken.balanceOf(holder.address, multiTokenIds[i])).to.be.bignumber.equal(multiTokenAmounts[i]);
    }
  });
});
