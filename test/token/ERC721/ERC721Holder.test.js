const { accounts, load } = require('@openzeppelin/test-env');
const [ creator ] = accounts;

const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721Holder = load.truffle('ERC721Holder');
const ERC721Mintable = load.truffle('ERC721MintableBurnableImpl');

describe('ERC721Holder', function () {
  it('receives an ERC721 token', async function () {
    const token = await ERC721Mintable.new({ from: creator });
    const tokenId = new BN(1);
    await token.mint(creator, tokenId, { from: creator });

    const receiver = await ERC721Holder.new();
    await token.approve(receiver.address, tokenId, { from: creator });
    await token.safeTransferFrom(creator, receiver.address, tokenId);

    expect(await token.ownerOf(tokenId)).to.be.equal(receiver.address);
  });
});
