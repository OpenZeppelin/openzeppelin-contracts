const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721Holder = contract.fromArtifact('ERC721Holder');
const ERC721Mintable = contract.fromArtifact('ERC721MintableBurnableImpl');

describe('ERC721Holder', function () {
  const [ creator ] = accounts;

  it('receives an ERC721 token', async function () {
    const token = await ERC721Mintable.new({ from: creator });
    const tokenId = new BN(1);
    await token.mint(creator, tokenId, { from: creator });

    const receiver = await ERC721Holder.new();
    await token.safeTransferFrom(creator, receiver.address, tokenId, { from: creator });

    expect(await token.ownerOf(tokenId)).to.be.equal(receiver.address);
  });
});
