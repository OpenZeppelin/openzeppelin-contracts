const { assertRevert } = require('../../helpers/assertRevert');
const { sendTransaction } = require('../../helpers/sendTransaction');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC721PausableToken (accounts) {
  const firstTokenId = 1;
  const owner = accounts[0];
  const recipient = accounts[1];
  const operator = accounts[2];
  const data = '0x42';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const safeTransferFromWithData = function (token, from, to, tokenId, opts) {
    return sendTransaction(
      token,
      'safeTransferFrom',
      'address,address,uint256,bytes',
      [from, to, tokenId, data],
      opts
    );
  };

  const shouldBehaveLikeUnpausedToken = function () {
    it('approves token transfer', async function () {
      await this.token.approve(recipient, firstTokenId, { from: owner });
      const approvedAccount = await this.token.getApproved(firstTokenId);
      approvedAccount.should.be.equal(recipient);
    });

    it('approves operator via setApprovalForAll', async function () {
      await this.token.setApprovalForAll(operator, true, { from: owner });
      const isApprovedForOperator = await this.token.isApprovedForAll(owner, operator);
      isApprovedForOperator.should.be.true;
    });

    it('transfers token', async function () {
      await this.token.transferFrom(owner, recipient, firstTokenId, { from: owner });
      const firstTokenOwner = await this.token.ownerOf(firstTokenId);
      firstTokenOwner.should.be.equal(recipient);
    });

    it('transfers token via safeTransferFrom', async function () {
      await this.token.safeTransferFrom(owner, recipient, firstTokenId, { from: owner });
      const firstTokenOwner = await this.token.ownerOf(firstTokenId);
      firstTokenOwner.should.be.equal(recipient);
    });

    it('transfers token via safeTransferFrom with data', async function () {
      await safeTransferFromWithData(this.token, owner, recipient, firstTokenId, { from: owner });
      const firstTokenOwner = await this.token.ownerOf(firstTokenId);
      firstTokenOwner.should.be.equal(recipient);
    });
  };

  describe('when token is not paused yet', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
    });

    shouldBehaveLikeUnpausedToken();
  });

  describe('when token is paused and unpaused', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
      await this.token.pause({ from: owner });
      await this.token.unpause({ from: owner });
    });

    shouldBehaveLikeUnpausedToken();
  });

  describe('when token is paused', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
      await this.token.pause({ from: owner });
    });

    it('reverts when trying to approve', async function () {
      await assertRevert(this.token.approve(recipient, firstTokenId, { from: owner }));
      const approvedAccount = await this.token.getApproved(firstTokenId);
      approvedAccount.should.be.equal(ZERO_ADDRESS);
    });

    it('reverts when trying to setApprovalForAll', async function () {
      await assertRevert(this.token.setApprovalForAll(operator, true, { from: owner }));
      const isApprovedForOperator = await this.token.isApprovedForAll(owner, operator);
      isApprovedForOperator.should.be.false;
    });

    it('reverts when trying to transferFrom', async function () {
      await assertRevert(this.token.transferFrom(owner, recipient, firstTokenId, { from: owner }));
      const firstTokenOwner = await this.token.ownerOf(firstTokenId);
      firstTokenOwner.should.be.equal(owner);
    });

    it('reverts when trying to safeTransferFrom', async function () {
      await assertRevert(this.token.safeTransferFrom(owner, recipient, firstTokenId, { from: owner }));
      const firstTokenOwner = await this.token.ownerOf(firstTokenId);
      firstTokenOwner.should.be.equal(owner);
    });

    it('reverts when trying to safeTransferFrom', async function () {
      await assertRevert(
        safeTransferFromWithData(this.token, owner, recipient, firstTokenId, { from: owner })
      );
      const firstTokenOwner = await this.token.ownerOf(firstTokenId);
      firstTokenOwner.should.be.equal(owner);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721PausableToken,
};
