const { BN } = require('openzeppelin-test-helpers');

const ERC721Holder = artifacts.require('ERC721Holder.sol');
const ERC721Mintable = artifacts.require('ERC721MintableBurnableImpl.sol');

contract('ERC721Holder', function ([creator]) {
  it('receives an ERC721 token', async function () {
    const token = await ERC721Mintable.new({ from: creator });
    const tokenId = new BN(1);
    await token.mint(creator, tokenId, { from: creator });

    const receiver = await ERC721Holder.new();
    await token.approve(receiver.address, tokenId, { from: creator });
    await token.safeTransferFrom(creator, receiver.address, tokenId);

    (await token.ownerOf(tokenId)).should.be.equal(receiver.address);
  });
});
