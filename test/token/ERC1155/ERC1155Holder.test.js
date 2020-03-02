const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN } = require('@openzeppelin/test-helpers');

const ERC1155Holder = contract.fromArtifact('ERC1155Holder');
const ERC1155Mock = contract.fromArtifact('ERC1155Mock');

const { expect } = require('chai');

describe('ERC1155Holder', function () {
  const [creator] = accounts;
  const multiTokenIds = [new BN(1), new BN(2), new BN(3)];
  const multiTokenAmounts = [new BN(1000), new BN(2000), new BN(3000)];
  const transferData = '0x12345678';
  // const onERC1155ReceivedSelector =
  let multiToken;
  let holder;

  beforeEach(async function () {
    multiToken = await ERC1155Mock.new({ from: creator });
    holder = await ERC1155Holder.new();
    await multiToken.mintBatch(creator, multiTokenIds, multiTokenAmounts, '0x', { from: creator });
  });

  it('receives ERC1155 tokens from a single ID', async function () {
    await multiToken.safeTransferFrom(
      creator,
      holder.address,
      multiTokenIds[0],
      multiTokenAmounts[0],
      transferData,
      { from: creator },
    );

    expect(await multiToken.balanceOf(holder.address, multiTokenIds[0])).to.be.bignumber.equal(multiTokenAmounts[0]);

    for (let i = 1; i < multiTokenIds.length; i++) {
      expect(await multiToken.balanceOf(holder.address, multiTokenIds[i])).to.be.bignumber.equal(new BN(0));
    }
  });

  it('receives ERC1155 tokens from a multiple IDs', async function () {
    for (let i = 0; i < multiTokenIds.length; i++) {
      expect(await multiToken.balanceOf(holder.address, multiTokenIds[i])).to.be.bignumber.equal(new BN(0));
    };

    await multiToken.safeBatchTransferFrom(
      creator,
      holder.address,
      multiTokenIds,
      multiTokenAmounts,
      transferData,
      { from: creator },
    );

    for (let i = 0; i < multiTokenIds.length; i++) {
      expect(await multiToken.balanceOf(holder.address, multiTokenIds[i])).to.be.bignumber.equal(multiTokenAmounts[i]);
    }
  });


});
