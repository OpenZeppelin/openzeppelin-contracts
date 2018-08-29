const ERC721Holder = artifacts.require('ERC721Holder.sol');

require('chai')
  .should();

function shouldBehaveLikeERC721Holder (accounts) {
  const tokenId = 1;
  const creator = accounts[0];

  describe('like an ERC721Holder', function () {
    it.only('safe transfers to a holder contract', async function () {
      await this.token.mint(creator, tokenId, { from: creator });
      receiver = await ERC721Holder.new();
      await this.token.approve(receiver.address, tokenId, { from: creator });

      await this.token.safeTransferFrom(creator, receiver.address, tokenId);

      (await this.token.ownerOf(tokenId)).should.be.equal(receiver.address);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721Holder,
};
