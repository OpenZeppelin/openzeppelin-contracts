import shouldBurnLikeERC721Token from './ERC721Burn.behaviour';
import assertRevert from '../../helpers/assertRevert';
const BurnableERC721Token = artifacts.require('BurnableERC721TokenMock');

contract('BurnableERC721Token', function ([creator, beneficiary, anotherAccount]) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const minter = creator;

  beforeEach(async function () {
    this.token = await BurnableERC721Token.new(name, symbol, { from: creator });
  });

  shouldBurnLikeERC721Token([minter, beneficiary, anotherAccount]);

  context('like a BurnableERC721Token', function () {
    const tokenId = 1;

    beforeEach(async function () {
      await this.token.mint(beneficiary, tokenId, { from: minter });
    });

    describe('when sender is not token owner', function () {
      it('reverts', async function () {
        await assertRevert(this.token.burn(tokenId, { from: anotherAccount }));
      });
    });
  });
});
