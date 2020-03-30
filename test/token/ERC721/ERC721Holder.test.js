const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721Holder = contract.fromArtifact('ERC721Holder');
const ERC721Mock = contract.fromArtifact('ERC721Mock');

describe('ERC721Holder', function () {
  const [ owner ] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  it('receives an ERC721 token', async function () {
    const token = await ERC721Mock.new(name, symbol);
    const tokenId = new BN(1);
    await token.mint(owner, tokenId);

    const receiver = await ERC721Holder.new();
    await token.safeTransferFrom(owner, receiver.address, tokenId, { from: owner });

    expect(await token.ownerOf(tokenId)).to.be.equal(receiver.address);
  });
});
