const { expect } = require('chai');

const ERC721Holder = artifacts.require('$ERC721Holder');
const ERC721 = artifacts.require('$ERC721');

contract('ERC721Holder', function (accounts) {
  const [owner] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const tokenId = web3.utils.toBN(1);

  it('receives an ERC721 token', async function () {
    const token = await ERC721.new(name, symbol);
    await token.$_mint(owner, tokenId);

    const receiver = await ERC721Holder.new();
    await token.safeTransferFrom(owner, receiver.address, tokenId, { from: owner });

    expect(await token.ownerOf(tokenId)).to.be.equal(receiver.address);
  });
});
