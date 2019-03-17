const { shouldFail } = require('openzeppelin-test-helpers');

function shouldBehaveLikeERC20Capped (minter, [anyone], cap) {
  describe('capped token', function () {
    const from = minter;

    it('should start with the correct cap', async function () {
      (await this.token.cap()).should.be.bignumber.equal(cap);
    });

    it('should mint when amount is less than cap', async function () {
      await this.token.mint(anyone, cap.subn(1), { from });
      (await this.token.totalSupply()).should.be.bignumber.equal(cap.subn(1));
    });

    it('should fail to mint if the amount exceeds the cap', async function () {
      await this.token.mint(anyone, cap.subn(1), { from });
      await shouldFail.reverting(this.token.mint(anyone, 2, { from }));
    });

    it('should fail to mint after cap is reached', async function () {
      await this.token.mint(anyone, cap, { from });
      await shouldFail.reverting(this.token.mint(anyone, 1, { from }));
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Capped,
};
