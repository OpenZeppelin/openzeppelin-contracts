const shouldFail = require('../../helpers/shouldFail');
const { sendTransaction } = require('../../helpers/sendTransaction');
const { ZERO_ADDRESS } = require('../../helpers/constants');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC721PausedToken (owner, [recipient, operator]) {
  const firstTokenId = 1;
  const mintedTokens = 1;
  const mockData = '0x42';

  describe('like a paused ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
    });

    it('reverts when trying to approve', async function () {
      await shouldFail.reverting(this.token.approve(recipient, firstTokenId, { from: owner }));
    });

    it('reverts when trying to setApprovalForAll', async function () {
      await shouldFail.reverting(this.token.setApprovalForAll(operator, true, { from: owner }));
    });

    it('reverts when trying to transferFrom', async function () {
      await shouldFail.reverting(this.token.transferFrom(owner, recipient, firstTokenId, { from: owner }));
    });

    it('reverts when trying to safeTransferFrom', async function () {
      await shouldFail.reverting(this.token.safeTransferFrom(owner, recipient, firstTokenId, { from: owner }));
    });

    it('reverts when trying to safeTransferFrom with data', async function () {
      await shouldFail.reverting(
        sendTransaction(
          this.token,
          'safeTransferFrom',
          'address,address,uint256,bytes',
          [owner, recipient, firstTokenId, mockData],
          { from: owner }
        )
      );
    });

    describe('getApproved', function () {
      it('returns approved address', async function () {
        const approvedAccount = await this.token.getApproved(firstTokenId);
        approvedAccount.should.be.equal(ZERO_ADDRESS);
      });
    });

    describe('balanceOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const balance = await this.token.balanceOf(owner);
        balance.should.be.bignumber.equal(mintedTokens);
      });
    });

    describe('ownerOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const ownerOfToken = await this.token.ownerOf(firstTokenId);
        ownerOfToken.should.be.equal(owner);
      });
    });

    describe('exists', function () {
      it('should return token existance', async function () {
        const result = await this.token.exists(firstTokenId);
        result.should.eq(true);
      });
    });

    describe('isApprovedForAll', function () {
      it('returns the approval of the operator', async function () {
        const isApproved = await this.token.isApprovedForAll(owner, operator);
        isApproved.should.eq(false);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721PausedToken,
};
