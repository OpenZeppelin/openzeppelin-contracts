const { expect } = require('chai');

function shouldBehaveLikeERC20Capped() {
  describe('capped token', function () {
    it('starts with the correct cap', async function () {
      expect(await this.token.cap()).to.equal(this.cap);
    });

    it('mints when value is less than cap', async function () {
      const value = this.cap - 1n;
      await this.token.$_mint(this.user, value);
      expect(await this.token.totalSupply()).to.equal(value);
    });

    it('fails to mint if the value exceeds the cap', async function () {
      await this.token.$_mint(this.user, this.cap - 1n);
      await expect(this.token.$_mint(this.user, 2))
        .to.be.revertedWithCustomError(this.token, 'ERC20ExceededCap')
        .withArgs(this.cap + 1n, this.cap);
    });

    it('fails to mint after cap is reached', async function () {
      await this.token.$_mint(this.user, this.cap);
      await expect(this.token.$_mint(this.user, 1))
        .to.be.revertedWithCustomError(this.token, 'ERC20ExceededCap')
        .withArgs(this.cap + 1n, this.cap);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Capped,
};
