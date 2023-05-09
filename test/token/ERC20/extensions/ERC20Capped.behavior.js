const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

function shouldBehaveLikeERC20Capped(accounts, cap) {
  describe('capped token', function () {
    const user = accounts[0];

    it('starts with the correct cap', async function () {
      expect(await this.token.cap()).to.be.bignumber.equal(cap);
    });

    it('mints when amount is less than cap', async function () {
      await this.token.$_mint(user, cap.subn(1));
      expect(await this.token.totalSupply()).to.be.bignumber.equal(cap.subn(1));
    });

    it('fails to mint if the amount exceeds the cap', async function () {
      await this.token.$_mint(user, cap.subn(1));
      await expectRevert(this.token.$_mint(user, 2), 'ERC20Capped: cap exceeded');
    });

    it('fails to mint after cap is reached', async function () {
      await this.token.$_mint(user, cap);
      await expectRevert(this.token.$_mint(user, 1), 'ERC20Capped: cap exceeded');
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Capped,
};
