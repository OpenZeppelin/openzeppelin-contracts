const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const { expectRevertCustomError } = require('../../../helpers/customError');

const ERC1155Pausable = artifacts.require('$ERC1155Pausable');

contract('ERC1155Pausable', function (accounts) {
  const [holder, operator, receiver, other] = accounts;

  const uri = 'https://token.com';

  beforeEach(async function () {
    this.token = await ERC1155Pausable.new(uri);
  });

  context('when token is paused', function () {
    const firstTokenId = new BN('37');
    const firstTokenAmount = new BN('42');

    const secondTokenId = new BN('19842');
    const secondTokenAmount = new BN('23');

    beforeEach(async function () {
      await this.token.setApprovalForAll(operator, true, { from: holder });
      await this.token.$_mint(holder, firstTokenId, firstTokenAmount, '0x');

      await this.token.$_pause();
    });

    it('reverts when trying to safeTransferFrom from holder', async function () {
      await expectRevertCustomError(
        this.token.safeTransferFrom(holder, receiver, firstTokenId, firstTokenAmount, '0x', { from: holder }),
        'EnforcedPause',
        [],
      );
    });

    it('reverts when trying to safeTransferFrom from operator', async function () {
      await expectRevertCustomError(
        this.token.safeTransferFrom(holder, receiver, firstTokenId, firstTokenAmount, '0x', { from: operator }),
        'EnforcedPause',
        [],
      );
    });

    it('reverts when trying to safeBatchTransferFrom from holder', async function () {
      await expectRevertCustomError(
        this.token.safeBatchTransferFrom(holder, receiver, [firstTokenId], [firstTokenAmount], '0x', { from: holder }),
        'EnforcedPause',
        [],
      );
    });

    it('reverts when trying to safeBatchTransferFrom from operator', async function () {
      await expectRevertCustomError(
        this.token.safeBatchTransferFrom(holder, receiver, [firstTokenId], [firstTokenAmount], '0x', {
          from: operator,
        }),
        'EnforcedPause',
        [],
      );
    });

    it('reverts when trying to mint', async function () {
      await expectRevertCustomError(
        this.token.$_mint(holder, secondTokenId, secondTokenAmount, '0x'),
        'EnforcedPause',
        [],
      );
    });

    it('reverts when trying to mintBatch', async function () {
      await expectRevertCustomError(
        this.token.$_mintBatch(holder, [secondTokenId], [secondTokenAmount], '0x'),
        'EnforcedPause',
        [],
      );
    });

    it('reverts when trying to burn', async function () {
      await expectRevertCustomError(this.token.$_burn(holder, firstTokenId, firstTokenAmount), 'EnforcedPause', []);
    });

    it('reverts when trying to burnBatch', async function () {
      await expectRevertCustomError(
        this.token.$_burnBatch(holder, [firstTokenId], [firstTokenAmount]),
        'EnforcedPause',
        [],
      );
    });

    describe('setApprovalForAll', function () {
      it('approves an operator', async function () {
        await this.token.setApprovalForAll(other, true, { from: holder });
        expect(await this.token.isApprovedForAll(holder, other)).to.equal(true);
      });
    });

    describe('balanceOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const balance = await this.token.balanceOf(holder, firstTokenId);
        expect(balance).to.be.bignumber.equal(firstTokenAmount);
      });
    });

    describe('isApprovedForAll', function () {
      it('returns the approval of the operator', async function () {
        expect(await this.token.isApprovedForAll(holder, operator)).to.equal(true);
      });
    });
  });
});
