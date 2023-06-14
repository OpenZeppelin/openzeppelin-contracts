const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { expectRevertCustomError } = require('../../../helpers/customError');

const ERC721Burnable = artifacts.require('$ERC721Burnable');

contract('ERC721Burnable', function (accounts) {
  const [owner, approved, another] = accounts;

  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const unknownTokenId = new BN(3);

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721Burnable.new(name, symbol);
  });

  describe('like a burnable ERC721', function () {
    beforeEach(async function () {
      await this.token.$_mint(owner, firstTokenId);
      await this.token.$_mint(owner, secondTokenId);
    });

    describe('burn', function () {
      const tokenId = firstTokenId;
      let receipt = null;

      describe('when successful', function () {
        beforeEach(async function () {
          receipt = await this.token.burn(tokenId, { from: owner });
        });

        it('burns the given token ID and adjusts the balance of the owner', async function () {
          await expectRevertCustomError(this.token.ownerOf(tokenId), 'ERC721NonexistentToken', [tokenId]);
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
        });

        it('emits a burn event', async function () {
          expectEvent(receipt, 'Transfer', {
            from: owner,
            to: constants.ZERO_ADDRESS,
            tokenId: tokenId,
          });
        });
      });

      describe('when there is a previous approval burned', function () {
        beforeEach(async function () {
          await this.token.approve(approved, tokenId, { from: owner });
          receipt = await this.token.burn(tokenId, { from: owner });
        });

        context('getApproved', function () {
          it('reverts', async function () {
            await expectRevertCustomError(this.token.getApproved(tokenId), 'ERC721NonexistentToken', [tokenId]);
          });
        });
      });

      describe('when there is no previous approval burned', function () {
        it('reverts', async function () {
          await expectRevertCustomError(this.token.burn(tokenId, { from: another }), 'ERC721InsufficientApproval', [
            another,
            tokenId,
          ]);
        });
      });

      describe('when the given token ID was not tracked by this contract', function () {
        it('reverts', async function () {
          await expectRevertCustomError(this.token.burn(unknownTokenId, { from: owner }), 'ERC721NonexistentToken', [
            unknownTokenId,
          ]);
        });
      });
    });
  });
});
