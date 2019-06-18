const { BN, constants, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeERC721PausedToken (owner, [recipient, operator]) {
  const firstTokenId = new BN(1);
  const mintedTokens = new BN(1);
  const mockData = '0x42';

  describe('like a paused ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
    });

    it('reverts when trying to approve', async function () {
      await expectRevert(
        this.token.approve(recipient, firstTokenId, { from: owner }), 'Pausable: paused'
      );
    });

    it('reverts when trying to setApprovalForAll', async function () {
      await expectRevert(
        this.token.setApprovalForAll(operator, true, { from: owner }), 'Pausable: paused'
      );
    });

    it('reverts when trying to transferFrom', async function () {
      await expectRevert(
        this.token.transferFrom(owner, recipient, firstTokenId, { from: owner }), 'Pausable: paused'
      );
    });

    it('reverts when trying to safeTransferFrom', async function () {
      await expectRevert(
        this.token.safeTransferFrom(owner, recipient, firstTokenId, { from: owner }), 'Pausable: paused'
      );
    });

    it('reverts when trying to safeTransferFrom with data', async function () {
      await expectRevert(
        this.token.methods['safeTransferFrom(address,address,uint256,bytes)'](
          owner, recipient, firstTokenId, mockData, { from: owner }
        ), 'Pausable: paused'
      );
    });

    describe('getApproved', function () {
      it('returns approved address', async function () {
        const approvedAccount = await this.token.getApproved(firstTokenId);
        expect(approvedAccount).to.be.equal(ZERO_ADDRESS);
      });
    });

    describe('balanceOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const balance = await this.token.balanceOf(owner);
        expect(balance).to.be.bignumber.equal(mintedTokens);
      });
    });

    describe('ownerOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const ownerOfToken = await this.token.ownerOf(firstTokenId);
        expect(ownerOfToken).to.be.equal(owner);
      });
    });

    describe('exists', function () {
      it('should return token existence', async function () {
        expect(await this.token.exists(firstTokenId)).to.equal(true);
      });
    });

    describe('isApprovedForAll', function () {
      it('returns the approval of the operator', async function () {
        expect(await this.token.isApprovedForAll(owner, operator)).to.equal(false);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721PausedToken,
};
