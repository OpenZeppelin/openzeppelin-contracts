const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const ids = [1n, 2n, 3n];
const values = [1000n, 2000n, 3000n];
const data = '0x12345678';

async function fixture() {
  const [owner] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC1155', ['https://token-cdn-domain/{id}.json']);
  const mock = await ethers.deployContract('$ERC1155Holder');

  await token.$_mintBatch(owner, ids, values, '0x');

  return { owner, token, mock };
}

describe('ERC1155Holder', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldSupportInterfaces(['ERC1155Receiver']);

  it('receives ERC1155 tokens from a single ID', async function () {
    await this.token.connect(this.owner).safeTransferFrom(this.owner, this.mock, ids[0], values[0], data);

    expect(await this.token.balanceOf(this.mock, ids[0])).to.equal(values[0]);

    for (let i = 1; i < ids.length; i++) {
      expect(await this.token.balanceOf(this.mock, ids[i])).to.equal(0n);
    }
  });

  it('receives ERC1155 tokens from a multiple IDs', async function () {
    expect(
      await this.token.balanceOfBatch(
        ids.map(() => this.mock),
        ids,
      ),
    ).to.deep.equal(ids.map(() => 0n));

    await this.token.connect(this.owner).safeBatchTransferFrom(this.owner, this.mock, ids, values, data);

    expect(
      await this.token.balanceOfBatch(
        ids.map(() => this.mock),
        ids,
      ),
    ).to.deep.equal(values);
  });
});
