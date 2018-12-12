require('../../helpers/setup');
const { ZERO_ADDRESS } = require('../../helpers/constants');
const expectEvent = require('../../helpers/expectEvent');
const send = require('../../helpers/send');
const shouldFail = require('../../helpers/shouldFail');

const { shouldBehaveLikeERC721 } = require('./ERC721.behavior');
const ERC721Mock = artifacts.require('ERC721Mock.sol');

contract('ERC721', function ([_, creator, tokenOwner, anyone, ...accounts]) {
  beforeEach(async function () {
    this.token = await ERC721Mock.new({ from: creator });
  });

  shouldBehaveLikeERC721(creator, creator, accounts);

  describe('internal functions', function () {
    const tokenId = 5042;

    describe('_mint(address, uint256)', function () {
      it('reverts with a null destination address', async function () {
        await shouldFail.reverting(this.token.mint(ZERO_ADDRESS, tokenId));
      });

      context('with minted token', async function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.mint(tokenOwner, tokenId));
        });

        it('emits a Transfer event', function () {
          expectEvent.inLogs(this.logs, 'Transfer', { from: ZERO_ADDRESS, to: tokenOwner, tokenId });
        });

        it('creates the token', async function () {
          (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal(1);
          (await this.token.ownerOf(tokenId)).should.equal(tokenOwner);
        });

        it('reverts when adding a token id that already exists', async function () {
          await shouldFail.reverting(this.token.mint(tokenOwner, tokenId));
        });
      });
    });

    describe('_burn(address, uint256)', function () {
      it('reverts when burning a non-existent token id', async function () {
        await shouldFail.reverting(send.transaction(this.token, 'burn', 'address,uint256', [tokenOwner, tokenId]));
      });

      context('with minted token', function () {
        beforeEach(async function () {
          await this.token.mint(tokenOwner, tokenId);
        });

        it('reverts when the account is not the owner', async function () {
          await shouldFail.reverting(send.transaction(this.token, 'burn', 'address,uint256', [anyone, tokenId]));
        });

        context('with burnt token', function () {
          beforeEach(async function () {
            ({ logs: this.logs } =
              await send.transaction(this.token, 'burn', 'address,uint256', [tokenOwner, tokenId]));
          });

          it('emits a Transfer event', function () {
            expectEvent.inLogs(this.logs, 'Transfer', { from: tokenOwner, to: ZERO_ADDRESS, tokenId });
          });

          it('deletes the token', async function () {
            (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal(0);
            await shouldFail.reverting(this.token.ownerOf(tokenId));
          });

          it('reverts when burning a token id that has been deleted', async function () {
            await shouldFail.reverting(send.transaction(this.token, 'burn', 'address,uint256', [tokenOwner, tokenId]));
          });
        });
      });
    });

    describe('_burn(uint256)', function () {
      it('reverts when burning a non-existent token id', async function () {
        await shouldFail.reverting(send.transaction(this.token, 'burn', 'uint256', [tokenId]));
      });

      context('with minted token', function () {
        beforeEach(async function () {
          await this.token.mint(tokenOwner, tokenId);
        });

        context('with burnt token', function () {
          beforeEach(async function () {
            ({ logs: this.logs } = await send.transaction(this.token, 'burn', 'uint256', [tokenId]));
          });

          it('emits a Transfer event', function () {
            expectEvent.inLogs(this.logs, 'Transfer', { from: tokenOwner, to: ZERO_ADDRESS, tokenId });
          });

          it('deletes the token', async function () {
            (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal(0);
            await shouldFail.reverting(this.token.ownerOf(tokenId));
          });

          it('reverts when burning a token id that has been deleted', async function () {
            await shouldFail.reverting(send.transaction(this.token, 'burn', 'uint256', [tokenId]));
          });
        });
      });
    });
  });
});
