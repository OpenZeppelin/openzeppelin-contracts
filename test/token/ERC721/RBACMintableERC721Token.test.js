import shouldBehaveLikeMintableERC721Token from './MintableERC721Token.behaviour';
import expectThrow from '../../helpers/expectThrow';
const RBACMintableERC721Token = artifacts.require('RBACMintableERC721Token');

const ROLE_MINTER = 'minter';

contract('RBACMintableERC721Token', function ([owner, minter, beneficiary, anotherAccount]) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await RBACMintableERC721Token.new(name, symbol, { from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  describe('handle roles', function () {
    it('owner can add and remove a minter role', async function () {
      await this.token.addMinter(anotherAccount, { from: owner });
      let hasRole = await this.token.hasRole(anotherAccount, ROLE_MINTER);
      assert.equal(hasRole, true);

      await this.token.removeMinter(anotherAccount, { from: owner });
      hasRole = await this.token.hasRole(anotherAccount, ROLE_MINTER);
      assert.equal(hasRole, false);
    });

    it('another account can\'t add or remove a minter role', async function () {
      await expectThrow(
        this.token.addMinter(anotherAccount, { from: anotherAccount })
      );

      await this.token.addMinter(anotherAccount, { from: owner });
      await expectThrow(
        this.token.removeMinter(anotherAccount, { from: anotherAccount })
      );
    });
  });

  shouldBehaveLikeMintableERC721Token([owner, minter, beneficiary, anotherAccount]);
});
