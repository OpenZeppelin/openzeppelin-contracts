const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC721PausableMock = contract.fromArtifact('ERC721PausableMock');

describe('ERC721Pausable', function () {
  const [ owner, receiver, operator ] = accounts;

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721PausableMock.new(name, symbol);
  });

  context('when token is paused', function () {
    const firstTokenId = new BN(1);
    const secondTokenId = new BN(1337);

    const mockData = '0x42';

    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: owner });
      await this.token.pause();
    });

    it('reverts when trying to transferFrom', async function () {
      await expectRevert(
        this.token.transferFrom(owner, receiver, firstTokenId, { from: owner }),
        'ERC721Pausable: token transfer while paused'
      );
    });

    it('reverts when trying to safeTransferFrom', async function () {
      await expectRevert(
        this.token.safeTransferFrom(owner, receiver, firstTokenId, { from: owner }),
        'ERC721Pausable: token transfer while paused'
      );
    });

    it('reverts when trying to safeTransferFrom with data', async function () {
      await expectRevert(
        this.token.methods['safeTransferFrom(address,address,uint256,bytes)'](
          owner, receiver, firstTokenId, mockData, { from: owner }
        ), 'ERC721Pausable: token transfer while paused'
      );
    });

    it('reverts when trying to mint', async function () {
      await expectRevert(
        this.token.mint(receiver, secondTokenId),
        'ERC721Pausable: token transfer while paused'
      );
    });

    it('reverts when trying to burn', async function () {
      await expectRevert(
        this.token.burn(firstTokenId),
        'ERC721Pausable: token transfer while paused'
      );
    });

    describe('getApproved', function () {
      it('returns approved address', async function () {
        const approvedAccount = await this.token.getApproved(firstTokenId);
        expect(approvedAccount).to.equal(ZERO_ADDRESS);
      });
    });

    describe('balanceOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const balance = await this.token.balanceOf(owner);
        expect(balance).to.be.bignumber.equal('1');
      });
    });

    describe('ownerOf', function () {
      it('returns the amount of tokens owned by the given address', async function () {
        const ownerOfToken = await this.token.ownerOf(firstTokenId);
        expect(ownerOfToken).to.equal(owner);
      });
    });

    describe('exists', function () {
      it('should return token existence', async function () {
        expect(await this.token.exists(firstTokenId)).to.equal(true);
      });
    });

    describe('isApprovedForAll', function () {
      it('returns the approval of the operator', async function () {
        expect(await this.token.isApprovedForAll(owner, operator)).to.equal(false);
      });
    });
  });
});
