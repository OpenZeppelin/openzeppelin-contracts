const { assertRevert } = require('../../helpers/assertRevert');
const { sendTransaction } = require('../../helpers/sendTransaction');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC721PausableToken ([owner, recipient, operator]) {
  const firstTokenId = 1;
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

  beforeEach(async function () {
    await this.token.mint(owner, firstTokenId, { from: owner });
    await this.token.pause({ from: owner });
  });

  it('reverts when trying to approve', async function () {
    await assertRevert(this.token.approve(recipient, firstTokenId, { from: owner }));
  });

  it('reverts when trying to setApprovalForAll', async function () {
    await assertRevert(this.token.setApprovalForAll(operator, true, { from: owner }));
  });

  it('reverts when trying to transferFrom', async function () {
    await assertRevert(this.token.transferFrom(owner, recipient, firstTokenId, { from: owner }));
  });

  it('reverts when trying to safeTransferFrom', async function () {
    await assertRevert(this.token.safeTransferFrom(owner, recipient, firstTokenId, { from: owner }));
  });

  it('reverts when trying to safeTransferFrom', async function () {
    await assertRevert(
      safeTransferFromWithData(this.token, owner, recipient, firstTokenId, { from: owner })
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
      balance.should.be.bignumber.equal(1);
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
      result.should.be.true;
    });
  });

  describe('isApprovedForAll', function () {
    it('returns the approval of the operator', async function () {
      const isApproved = await this.token.isApprovedForAll(owner, operator);
      isApproved.should.be.false;
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721PausableToken,
};
