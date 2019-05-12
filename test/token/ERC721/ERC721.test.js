const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const ERC721Mock = artifacts.require('ERC721Mock.sol');

contract('ERC721', function ([_, creator, tokenOwner, other, ...accounts]) {
  beforeEach(async function () {
    this.token = await ERC721Mock.new({ from: creator });
  });

  shouldBehaveLikeERC721(creator, creator, accounts);

  describe('internal functions', function () {
    const tokenId = new BN('5042');

    describe('_mint(address, uint256)', function () {
      it('reverts with a null destination address', async function () {
        await shouldFail.reverting.withMessage(
          this.token.mint(ZERO_ADDRESS, tokenId), 'ERC721: mint to the zero address'
        );
      });

      context('with minted token', async function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.mint(tokenOwner, tokenId));
        });

        it('emits a Transfer event', function () {
          expectEvent.inLogs(this.logs, 'Transfer', { from: ZERO_ADDRESS, to: tokenOwner, tokenId });
        });

        it('creates the token', async function () {
          (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal('1');
          (await this.token.ownerOf(tokenId)).should.equal(tokenOwner);
        });

        it('reverts when adding a token id that already exists', async function () {
          await shouldFail.reverting.withMessage(this.token.mint(tokenOwner, tokenId), 'ERC721: token already minted');
        });
      });
    });

    describe('_burn(address, uint256)', function () {
      it('reverts when burning a non-existent token id', async function () {
        await shouldFail.reverting.withMessage(
          this.token.methods['burn(address,uint256)'](tokenOwner, tokenId), 'ERC721: owner query for nonexistent token'
        );
      });

      context('with minted token', function () {
        beforeEach(async function () {
          await this.token.mint(tokenOwner, tokenId);
        });

        it('reverts when the account is not the owner', async function () {
          await shouldFail.reverting.withMessage(
            this.token.methods['burn(address,uint256)'](other, tokenId), 'ERC721: burn of token that is not own'
          );
        });

        context('with burnt token', function () {
          beforeEach(async function () {
            ({ logs: this.logs } = await this.token.methods['burn(address,uint256)'](tokenOwner, tokenId));
          });

          it('emits a Transfer event', function () {
            expectEvent.inLogs(this.logs, 'Transfer', { from: tokenOwner, to: ZERO_ADDRESS, tokenId });
          });

          it('deletes the token', async function () {
            (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal('0');
            await shouldFail.reverting.withMessage(
              this.token.ownerOf(tokenId), 'ERC721: owner query for nonexistent token'
            );
          });

          it('reverts when burning a token id that has been deleted', async function () {
            await shouldFail.reverting.withMessage(
              this.token.methods['burn(address,uint256)'](tokenOwner, tokenId),
              'ERC721: owner query for nonexistent token'
            );
          });
        });
      });
    });

    describe('_burn(uint256)', function () {
      it('reverts when burning a non-existent token id', async function () {
        await shouldFail.reverting.withMessage(
          this.token.methods['burn(uint256)'](tokenId), 'ERC721: owner query for nonexistent token'
        );
      });

      context('with minted token', function () {
        beforeEach(async function () {
          await this.token.mint(tokenOwner, tokenId);
        });

        context('with burnt token', function () {
          beforeEach(async function () {
            ({ logs: this.logs } = await this.token.methods['burn(uint256)'](tokenId));
          });

          it('emits a Transfer event', function () {
            expectEvent.inLogs(this.logs, 'Transfer', { from: tokenOwner, to: ZERO_ADDRESS, tokenId });
          });

          it('deletes the token', async function () {
            (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal('0');
            await shouldFail.reverting.withMessage(
              this.token.ownerOf(tokenId), 'ERC721: owner query for nonexistent token'
            );
          });

          it('reverts when burning a token id that has been deleted', async function () {
            await shouldFail.reverting.withMessage(
              this.token.methods['burn(uint256)'](tokenId), 'ERC721: owner query for nonexistent token'
            );
          });
        });
      });
    });
  });
});
