const { expectThrow } = require('../../helpers/expectThrow');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeCappedToken (minter, [anyone], cap) {
  describe('capped token', function () {
    const from = minter;

    it('should start with the correct cap', async function () {
      (await this.token.cap()).should.be.bignumber.equal(cap);
    });

    it('should mint when amount is less than cap', async function () {
      const result = await this.token.mint(anyone, cap.sub(1), { from });
      result.logs[0].event.should.equal('Mint');
    });

    it('should fail to mint if the ammount exceeds the cap', async function () {
      await this.token.mint(anyone, cap.sub(1), { from });
      await expectThrow(this.token.mint(anyone, 100, { from }));
    });

    it('should fail to mint after cap is reached', async function () {
      await this.token.mint(anyone, cap, { from });
      await expectThrow(this.token.mint(anyone, 1, { from }));
    });
  });
}

module.exports = {
  shouldBehaveLikeCappedToken,
};
