const { expectThrow } = require('../../helpers/expectThrow');

function shouldBehaveLikeCappedToken ([owner, anotherAccount, minter, cap]) {
  describe('capped token', function () {
    const from = minter;

    it('should start with the correct cap', async function () {
      const _cap = await this.token.cap();

      assert(cap.eq(_cap));
    });

    it('should mint when amount is less than cap', async function () {
      const result = await this.token.mint(owner, cap.sub(1), { from });
      assert.equal(result.logs[0].event, 'Mint');
    });

    it('should fail to mint if the ammount exceeds the cap', async function () {
      await this.token.mint(owner, cap.sub(1), { from });
      await expectThrow(this.token.mint(owner, 100, { from }));
    });

    it('should fail to mint after cap is reached', async function () {
      await this.token.mint(owner, cap, { from });
      await expectThrow(this.token.mint(owner, 1, { from }));
    });
  });
}

module.exports = {
  shouldBehaveLikeCappedToken,
};
