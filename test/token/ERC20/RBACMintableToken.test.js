import assertRevert from '../../helpers/assertRevert';
const RBACMintableToken = artifacts.require('RBACMintableToken');

const ROLE_MINTER = 'minter';

contract('RBACMintable', function ([owner, anotherAccount, minter]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: owner });
    await this.token.adminAddRole(minter, ROLE_MINTER);
  });

  describe('mint', function () {
    const amount = 100;

    describe('when the sender has the minter role', function () {
      const from = minter;

      describe('when the token minting is not finished', function () {
        it('mints the requested amount', async function () {
          await this.token.mint(owner, amount, { from });

          const balance = await this.token.balanceOf(owner);
          assert.equal(balance, amount);
        });

        it('emits a mint and a transfer event', async function () {
          const { logs } = await this.token.mint(owner, amount, { from });

          assert.equal(logs.length, 2);
          assert.equal(logs[0].event, 'Mint');
          assert.equal(logs[0].args.to, owner);
          assert.equal(logs[0].args.amount, amount);
          assert.equal(logs[1].event, 'Transfer');
        });
      });

      describe('when the token minting is finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.mint(owner, amount, { from }));
        });
      });
    });

    describe('when the sender has not the minter role', function () {
      const from = anotherAccount;

      describe('when the token minting is not finished', function () {
        it('reverts', async function () {
          await assertRevert(this.token.mint(owner, amount, { from }));
        });
      });

      describe('when the token minting is already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.mint(owner, amount, { from }));
        });
      });
    });
  });
});
