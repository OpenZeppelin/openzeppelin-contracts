const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

function shouldBehaveLikeERC20Capped (minter, [other], cap) {
  describe('capped token', function () {
    const from = minter;

    it('starts with the correct cap', async function () {
      expect(await this.token.cap()).to.be.bignumber.equal(cap);
    });

    it('mints when amount is less than cap', async function () {
      await this.token.mint(other, cap.subn(1), { from });
      expect(await this.token.totalSupply()).to.be.bignumber.equal(cap.subn(1));
    });

    it('fails to mint if the amount exceeds the cap', async function () {
      await this.token.mint(other, cap.subn(1), { from });
      await expectRevert(this.token.mint(other, 2, { from }), 'ERC20Capped: cap exceeded');
    });

    it('fails to mint after cap is reached', async function () {
      await this.token.mint(other, cap, { from });
      await expectRevert(this.token.mint(other, 1, { from }), 'ERC20Capped: cap exceeded');
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Capped,
};
