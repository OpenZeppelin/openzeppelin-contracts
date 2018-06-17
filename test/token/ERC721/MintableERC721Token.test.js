import assertRevert from '../../helpers/assertRevert';
import expectThrow from '../../helpers/expectThrow';
import expectEvent from '../../helpers/expectEvent';

const ROLE_OWNER = 'owner';
const ROLE_MINTER = 'minter';

const tokenId = 1;
const TOKEN_URI = '';

const MintableERC721Token = artifacts.require('MintableERC721TokenImpl');

contract('MintableERC721Token', function ([_, owner, minter, beneficiary, anotherAccount]) {
  beforeEach(async function () {
    this.token = await MintableERC721Token.new('Test Token', 'TEST', { from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  context('roles', function () {
    it('owner can add and remove a minter role', async function () {
      await this.token.addMinter(anotherAccount, { from: owner });
      let hasRole = await this.token.hasRole(anotherAccount, ROLE_MINTER);
      hasRole.should.eq(true);

      await this.token.removeMinter(anotherAccount, { from: owner });
      hasRole = await this.token.hasRole(anotherAccount, ROLE_MINTER);
      hasRole.should.eq(false);
    });

    it('another account can\'t add or remove a minter role', async function () {
      await expectThrow(
        this.token.addMinter(anotherAccount, { from: anotherAccount })
      );

      await this.token.addMinter(anotherAccount, { from: owner });
      await expectThrow(
        this.token.removeMinter(anotherAccount, { from: anotherAccount })
      );
    });
  });

  context('after token creation', function () {
    it('sender should be token owner', async function () {
      const hasRole = await this.token.hasRole(owner, ROLE_OWNER);
      hasRole.should.eq(true);
    });

    it('has not finished minting', async function () {
      const mintingFinished = await this.token.mintingFinished();
      mintingFinished.should.eq(false);
    });
  });

  context('minting finished', function () {
    describe('when the token is minting finished', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: minter });
      });

      it('returns true for mintingFinished', async function () {
        const mintingFinished = await this.token.mintingFinished();
        mintingFinished.should.eq(true);
      });
    });
  });

  describe('finishMinting()', function () {
    context('when the sender is the token owner', function () {
      context('not finished minting', function () {
        it('finishes token minting', async function () {
          await this.token.finishMinting({ from: owner });

          const mintingFinished = await this.token.mintingFinished();
          mintingFinished.should.eq(true);
        });

        it('emits a mint finished event', async function () {
          const { logs } = await this.token.finishMinting({ from: owner });

          await expectEvent.inLogs(logs, 'MintFinished');
        });
      });

      describe('when the token minting was already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('reverts', async function () {
          await assertRevert(
            this.token.finishMinting({ from: owner })
          );
        });
      });
    });

    context('when the sender has no permission', function () {
      context('when the token minting was not finished', function () {
        it('reverts', async function () {
          await assertRevert(this.token.finishMinting({ from: anotherAccount }));
        });
      });

      context('when the token minting was already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.finishMinting({ from: anotherAccount }));
        });
      });
    });
  });

  context('when the sender is a minter', function () {
    context('when the token minting is finished', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: owner });
      });

      it('reverts', async function () {
        await assertRevert(
          this.token.mint(beneficiary, tokenId, TOKEN_URI, { from: minter })
        );
      });
    });
  });

  context('when the sender is not minter', function () {
    context('when the token minting is not finished', function () {
      it('reverts', async function () {
        await assertRevert(
          this.token.mint(beneficiary, tokenId, TOKEN_URI, { from: anotherAccount })
        );
      });
    });

    context('when the token minting is already finished', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: owner });
      });

      it('reverts', async function () {
        await assertRevert(
          this.token.mint(beneficiary, tokenId, TOKEN_URI, { from: anotherAccount })
        );
      });
    });
  });
});
