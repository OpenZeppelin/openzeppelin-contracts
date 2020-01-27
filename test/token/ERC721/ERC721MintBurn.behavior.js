const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

function shouldBehaveLikeMintAndBurnERC721 (
  creator,
  minter,
  [owner, newOwner, approved]
) {
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const thirdTokenId = new BN(3);
  const unknownTokenId = new BN(4);
  const MOCK_URI = 'https://example.com';
  const data = '0x42';

  describe('like a mintable and burnable ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: minter });
      await this.token.mint(owner, secondTokenId, { from: minter });
    });

    describe('mint', function () {
      let logs = null;

      describe('when successful', function () {
        beforeEach(async function () {
          const result = await this.token.mint(newOwner, thirdTokenId, { from: minter });
          logs = result.logs;
        });

        it('assigns the token to the new owner', async function () {
          expect(await this.token.ownerOf(thirdTokenId)).to.equal(newOwner);
        });

        it('increases the balance of its owner', async function () {
          expect(await this.token.balanceOf(newOwner)).to.be.bignumber.equal('1');
        });

        it('emits a transfer and minted event', async function () {
          expectEvent.inLogs(logs, 'Transfer', {
            from: ZERO_ADDRESS,
            to: newOwner,
            tokenId: thirdTokenId,
          });
        });
      });

      describe('when the given owner address is the zero address', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.mint(ZERO_ADDRESS, thirdTokenId, { from: minter }),
            'ERC721: mint to the zero address'
          );
        });
      });

      describe('when the given token ID was already tracked by this contract', function () {
        it('reverts', async function () {
          await expectRevert(this.token.mint(owner, firstTokenId, { from: minter }),
            'ERC721: token already minted.'
          );
        });
      });
    });

    describe('mintWithTokenURI', function () {
      it('can mint with a tokenUri', async function () {
        await this.token.mintWithTokenURI(newOwner, thirdTokenId, MOCK_URI, {
          from: minter,
        });
      });
    });

    describe('safeMint', function () {
      it('it can safely mint with data', async function () {
        await this.token.methods['safeMint(address,uint256,bytes)'](...[newOwner, thirdTokenId, data],
          { from: minter });
      });

      it('it can safely mint without data', async function () {
        await this.token.methods['safeMint(address,uint256)'](...[newOwner, thirdTokenId],
          { from: minter });
      });
    });

    describe('burn', function () {
      const tokenId = firstTokenId;
      let logs = null;

      describe('when successful', function () {
        beforeEach(async function () {
          const result = await this.token.burn(tokenId, { from: owner });
          logs = result.logs;
        });

        it('burns the given token ID and adjusts the balance of the owner', async function () {
          await expectRevert(
            this.token.ownerOf(tokenId),
            'ERC721: owner query for nonexistent token'
          );
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
        });

        it('emits a burn event', async function () {
          expectEvent.inLogs(logs, 'Transfer', {
            from: owner,
            to: ZERO_ADDRESS,
            tokenId: tokenId,
          });
        });
      });

      describe('when there is a previous approval burned', function () {
        beforeEach(async function () {
          await this.token.approve(approved, tokenId, { from: owner });
          const result = await this.token.burn(tokenId, { from: owner });
          logs = result.logs;
        });

        context('getApproved', function () {
          it('reverts', async function () {
            await expectRevert(
              this.token.getApproved(tokenId), 'ERC721: approved query for nonexistent token'
            );
          });
        });
      });

      describe('when the given token ID was not tracked by this contract', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.burn(unknownTokenId, { from: creator }), 'ERC721: operator query for nonexistent token'
          );
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeMintAndBurnERC721,
};
