import assertRevert from '../helpers/assertRevert';
const TaxedTokenMock = artifacts.require('TaxedTokenMock');

contract('TaxedToken', function ([owner, recipient, feeAccount]) {
  beforeEach(async function () {
    this.token = await TaxedTokenMock.new(owner, 1000, feeAccount, 5, 1);
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = 1001;

        it('reverts', async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));

          const ownerBalance = await this.token.balanceOf(owner);
          assert.equal(ownerBalance, 1000);
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, { from: owner });

          const ownerBalance = await this.token.balanceOf(owner);
          assert.equal(ownerBalance, 900);

          const recipientBalance = await this.token.balanceOf(to);
          assert.equal(recipientBalance, 99);

          const feeAccountBalance = await this.token.balanceOf(feeAccount);
          assert.equal(feeAccountBalance, 1);
        });

        it('emits the transfer events', async function () {
          const { logs } = await this.token.transfer(to, amount, { from: owner });

          assert.equal(logs.length, 2);
          assert.equal(logs[0].event, 'Transfer');
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, feeAccount);
          assert(logs[0].args.value.eq(1));

          assert.equal(logs[1].event, 'Transfer');
          assert.equal(logs[1].args.from, owner);
          assert.equal(logs[1].args.to, to);
          assert(logs[1].args.value.eq(99));
        });

        it('reverts if not evenly divisible', async function () {
          await assertRevert(this.token.transfer(to, 99, { from: owner }));
        });

        it('transfers the max fee', async function () {
          this.token.transfer(to, 600, { from: owner });

          const ownerBalance = await this.token.balanceOf(owner);
          assert.equal(ownerBalance, 400);

          const recipientBalance = await this.token.balanceOf(to);
          assert.equal(recipientBalance, 595);

          const feeAccountBalance = await this.token.balanceOf(feeAccount);
          assert.equal(feeAccountBalance, 5);
        });
      });
    });
  });
});
