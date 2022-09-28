const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { latest } = require('@openzeppelin/test-helpers/src/time');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');
const firstTokenId = new BN('5042');
const secondTokenId = new BN('79217');
const nonExistentTokenId = new BN('13');

const userExpiresTimestamp = new BN('18446744073709551615');

function shouldBehaveLikeERC4907 (errorPrefix, owner, approved, operator, other) {
  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
    'ERC4907',
  ]);

  context('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.mint(firstTokenId, owner);
      await this.token.mint(secondTokenId, owner);
      this.toUser = other; // default to other for toUser in context-dependent tests
    });

    describe('userOf', function () {
      context('when the given token ID was tracked by this token', function () {
        it('returns the user of the given token ID if user not expired', async function () {
          const timestamp = await latest();
          const _expires = timestamp.add(new BN('86400'));
          await this.token.setUser(firstTokenId, this.toUser, _expires, { from: owner });
          if (_expires.gte(timestamp)) {
            expect(await this.token.userOf(firstTokenId)).to.be.equal(this.toUser);
          } else {
            expect(await this.token.userOf(firstTokenId)).to.be.equal(ZERO_ADDRESS);
          }
        });

        it('returns ZERO_ADDRESS if user expired', async function () {
          await this.token.setUser(secondTokenId, this.toUser, 0, { from: owner });
          expect(await this.token.userOf(secondTokenId)).to.be.equal(ZERO_ADDRESS);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId;
        it('returns ZERO_ADDRESS', async function () {
          expect(await this.token.userOf(tokenId)).to.be.equal(ZERO_ADDRESS);
        });
      });
    });

    describe('setUser', function () {
      const tokenId = firstTokenId;
      let receipt = null;

      beforeEach(async function () {
        await this.token.approve(approved, tokenId, { from: owner });
        await this.token.setApprovalForAll(operator, true, { from: owner });
      });

      const setUserSuccessful = function () {
        it('transfers the user of the given token ID to the given address', async function () {
          const timestamp = await latest();
          if (userExpiresTimestamp.gte(timestamp)) {
            expect(await this.token.userOf(tokenId)).to.be.equal(this.toUser);
          } else {
            expect(await this.token.userOf(tokenId)).to.be.equal(ZERO_ADDRESS);
          }
          expect(await this.token.userExpires(tokenId)).to.be.bignumber.equal(userExpiresTimestamp);
        });

        it('owner still own the NFT', async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
        });

        it('emits a UpdateUser event', async function () {
          expectEvent(receipt, 'UpdateUser', { tokenId: tokenId, user: this.toUser, expires: userExpiresTimestamp });
        });
      };

      const shouldSetUserByOperator = function (setUserFunction) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            (receipt = await setUserFunction.call(this, tokenId, this.toUser, userExpiresTimestamp, owner));
          });
          setUserSuccessful();
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
            (receipt = await setUserFunction.call(this, tokenId, this.toUser, userExpiresTimestamp, approved));
          });
          setUserSuccessful();
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
            (receipt = await setUserFunction.call(this, tokenId, this.toUser, userExpiresTimestamp, operator));
          });
          setUserSuccessful();
        });

        context('when called by other', function () {
          it('reverts', async function () {
            await expectRevert(
              setUserFunction.call(this, tokenId, this.toUser, userExpiresTimestamp, other),
              'ERC721: transfer caller is not owner nor approved',
            );
          });
        });
      };

      describe('via setUser', function () {
        shouldSetUserByOperator(function (tokenId, user, expires, from) {
          return this.token.setUser(tokenId, user, expires, { from: from });
        });
      });
    });

    describe('_burn', function () {
      const burnedId = new BN('4907');
      let receipt = null;

      const burnSuccessful = function () {
        it('burn the given token ID to the given address', async function () {
          expect(await this.token.userOf(burnedId)).to.be.equal(ZERO_ADDRESS);
          expect(await this.token.userExpires(burnedId)).to.be.bignumber.equal(new BN(0));
        });
        it('emits a UpdateUser event', async function () {
          expectEvent(receipt, 'UpdateUser', { tokenId: burnedId, user: ZERO_ADDRESS, expires: new BN(0) });
        });
      };

      const shouldBurnByOperator = function (burnFunction) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            await this.token.mint(burnedId, owner, { from: owner });
            (receipt = await burnFunction.call(this, burnedId, owner));
          });
          burnSuccessful();
        });
      };

      describe('via burn', function () {
        shouldBurnByOperator(function (tokenId, from) {
          return this.token.burn(tokenId, { from: from });
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC4907,
};
