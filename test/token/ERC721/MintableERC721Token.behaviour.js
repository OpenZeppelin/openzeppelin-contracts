import shouldMintLikeERC721Token from './ERC721Mint.behaviour';
import assertRevert from '../../helpers/assertRevert';

export default function ([owner, minter, beneficiary, anotherAccount]) {
  const tokenId = 1;

  context('like a MintableERC721Token', function () {
    describe('after token creation', function () {
      it('sender should be token owner', async function () {
        const tokenOwner = await this.token.owner();
        tokenOwner.should.equal(owner);
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
          await this.token.finishMinting({ from: owner });
        });

        it('returns true', async function () {
          const mintingFinished = await this.token.mintingFinished();
          assert.equal(mintingFinished, true);
        });
      });
    });

    describe('finish minting', function () {
      describe('when the sender is the token owner', function () {
        const from = owner;

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

      describe('when the sender is not the token owner', function () {
        const from = anotherAccount;

        describe('when the token minting was not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });

        describe('when the token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });
    });

    describe('when the sender has the minting permission', function () {
      describe('when the token minting is not finished', function () {
        shouldMintLikeERC721Token([owner, beneficiary]);
      });

      describe('when the token minting is finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.mint(beneficiary, tokenId, { from: owner }));
        });
      });
    });

    describe('when the sender has not the minting permission', function () {
      describe('when the token minting is not finished', function () {
        it('reverts', async function () {
          await assertRevert(this.token.mint(beneficiary, tokenId, { from: anotherAccount }));
        });
      });

      describe('when the token minting is already finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.mint(beneficiary, tokenId, { from: anotherAccount }));
        });
      });
    });
  });
}
