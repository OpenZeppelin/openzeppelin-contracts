import assertRevert from '../../helpers/assertRevert';
import expectThrow from '../../helpers/expectThrow';
const RBACMintableToken = artifacts.require('RBACMintableToken');

const ROLE_ADMIN = 'admin';
const ROLE_MINTER = 'minter';

contract('RBACMintableToken', function ([admin, anotherAccount, minter]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: admin });
  });

  describe('after token creation', function () {
    it('sender should have the admin role', async function () {
      const hasRole = await this.token.hasRole(admin, ROLE_ADMIN);
      assert.equal(hasRole, true);
    });

    it('admin can add and remove a minter role', async function () {
      await this.token.adminAddRole(minter, ROLE_MINTER, { from: admin });
      let hasRole = await this.token.hasRole(minter, ROLE_MINTER);
      assert.equal(hasRole, true);

      await this.token.adminRemoveRole(minter, ROLE_MINTER, { from: admin });
      hasRole = await this.token.hasRole(minter, ROLE_MINTER);
      assert.equal(hasRole, false);
    });

    it('another account can\'t add or remove a minter role', async function () {
      await expectThrow(
        this.token.adminAddRole(minter, ROLE_MINTER, { from: anotherAccount })
      );

      await this.token.adminAddRole(minter, ROLE_MINTER, { from: admin });
      await expectThrow(
        this.token.adminRemoveRole(minter, ROLE_MINTER, { from: anotherAccount })
      );
    });
  });

  describe('minting finished', function () {
    describe('when the token minting is not finished', function () {
      it('returns false', async function () {
        const mintingFinished = await this.token.mintingFinished();
        assert.equal(mintingFinished, false);
      });
    });

    describe('when the token is minting finished', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: admin });
      });

      it('returns true', async function () {
        const mintingFinished = await this.token.mintingFinished();
        assert.equal(mintingFinished, true);
      });
    });
  });

  describe('finish minting', function () {
    describe('when the sender has the admin role', function () {
      const from = admin;

      describe('when the token minting was not finished', function () {
        it('finishes token minting', async function () {
          await this.token.finishMinting({ from });

          const mintingFinished = await this.token.mintingFinished();
          assert.equal(mintingFinished, true);
        });

        it('emits a mint finished event', async function () {
          const { logs } = await this.token.finishMinting({ from });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'MintFinished');
        });
      });

      describe('when the token minting was already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from });
        });

        it('reverts', async function () {
          await assertRevert(this.token.finishMinting({ from }));
        });
      });
    });

    describe('when the sender has not the admin role', function () {
      const from = anotherAccount;

      describe('when the token minting was not finished', function () {
        it('reverts', async function () {
          await assertRevert(this.token.finishMinting({ from }));
        });
      });

      describe('when the token was already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: admin });
        });

        it('reverts', async function () {
          await assertRevert(this.token.finishMinting({ from }));
        });
      });
    });
  });

  describe('mint', function () {
    const amount = 100;

    describe('when the sender has the minter role', function () {
      const from = minter;

      beforeEach(async function () {
        this.token = await RBACMintableToken.new({ from: admin });
        await this.token.adminAddRole(minter, ROLE_MINTER);
      });

      describe('when the token minting is not finished', function () {
        it('mints the requested amount', async function () {
          await this.token.mint(anotherAccount, amount, { from });

          const balance = await this.token.balanceOf(anotherAccount);
          assert.equal(balance, amount);
        });

        it('emits a mint and a transfer event', async function () {
          const { logs } = await this.token.mint(anotherAccount, amount, { from });

          assert.equal(logs.length, 2);
          assert.equal(logs[0].event, 'Mint');
          assert.equal(logs[0].args.to, anotherAccount);
          assert.equal(logs[0].args.amount, amount);
          assert.equal(logs[1].event, 'Transfer');
        });
      });

      describe('when the token minting is finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: admin });
        });

        it('reverts', async function () {
          await assertRevert(this.token.mint(anotherAccount, amount, { from }));
        });
      });
    });

    describe('when the sender has not the minter role', function () {
      const from = anotherAccount;

      describe('when the token minting is not finished', function () {
        it('reverts', async function () {
          await assertRevert(this.token.mint(anotherAccount, amount, { from }));
        });
      });

      describe('when the token minting is already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: admin });
        });

        it('reverts', async function () {
          await assertRevert(this.token.mint(anotherAccount, amount, { from }));
        });
      });
    });
  });
});
