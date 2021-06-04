const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC1155EnumerableMock = artifacts.require('ERC1155EnumerableMock');

contract('ERC1155Enumerable', function (accounts) {
  const [ holder, operator, receiver, other ] = accounts;

  const uri = 'https://token.com';

  beforeEach(async () => {
    this.token = await ERC1155EnumerableMock.new(uri);
  });

  it('without tokens', async () => {
    expect(await this.token.tokenCountOf(holder)).to.be.bignumber.equal('0');
    expect(await this.token.tokenCountOf(operator)).to.be.bignumber.equal('0');
    expect(await this.token.tokenCountOf(receiver)).to.be.bignumber.equal('0');
    expect(await this.token.tokenCountOf(other)).to.be.bignumber.equal('0');

    await expectRevert(this.token.tokenOfOwnerByIndex(holder, 0), 'ERC1155Enumerable: owner index out of bounds');
  });

  describe('with tokens', async () => {
    const firstTokenId = new BN('37');
    const firstTokenAmount = new BN('42');

    const secondTokenId = new BN('19842');
    const secondTokenAmount = new BN('23');

    beforeEach(async () => {
      await this.token.mint(holder, firstTokenId, firstTokenAmount, '0x');
      await this.token.mint(holder, secondTokenId, secondTokenAmount, '0x');
    });

    it('returns correct token IDs for target', async () => {
      expect(await this.token.tokenCountOf(holder)).to.be.bignumber.equal('2');

      expect(
        (await Promise.all(
          Array(2).fill().map((_, i) => this.token.tokenOfOwnerByIndex(holder, i)),
        )).map(t => t.toNumber()),
      ).to.have.members([firstTokenId.toNumber(), secondTokenId.toNumber()]);
    });

    describe('after transfer', async () => {
      beforeEach(async () => {
        await this.token.safeTransferFrom(holder, receiver, firstTokenId, firstTokenAmount, '0x', { from: holder });
        await this.token.safeTransferFrom(holder, receiver, secondTokenId, '1', '0x', { from: holder });
        await this.token.safeTransferFrom(holder, receiver, secondTokenId, '1', '0x', { from: holder });
        await this.token.safeTransferFrom(holder, receiver, secondTokenId, '1', '0x', { from: holder });
        await this.token.safeTransferFrom(holder, other, secondTokenId, '1', '0x', { from: holder });
        await this.token.safeTransferFrom(holder, other, secondTokenId, '1', '0x', { from: holder });
        await this.token.safeTransferFrom(holder, other, secondTokenId, '1', '0x', { from: holder });
      });

      it('returns correct token IDs for target', async () => {
        expect(await this.token.tokenCountOf(holder)).to.be.bignumber.equal('1');
        expect(await this.token.tokenCountOf(receiver)).to.be.bignumber.equal('2');
        expect(await this.token.tokenCountOf(other)).to.be.bignumber.equal('1');

        expect(await this.token.tokenOfOwnerByIndex(holder, 0)).to.be.bignumber.equal(secondTokenId);
        expect(await this.token.tokenOfOwnerByIndex(other, 0)).to.be.bignumber.equal(secondTokenId);

        expect(
          (await Promise.all(
            Array(2).fill().map((_, i) => this.token.tokenOfOwnerByIndex(receiver, i)),
          )).map(t => t.toNumber()),
        ).to.have.members([firstTokenId.toNumber(), secondTokenId.toNumber()]);
      });
    });

    describe('after burn', async () => {
      beforeEach(async () => {
        await this.token.burn(holder, firstTokenId, '1', { from: holder });
        await this.token.burn(holder, secondTokenId, secondTokenAmount, { from: holder });
      });

      it('returns correct token IDs for target', async () => {
        expect(await this.token.tokenCountOf(holder)).to.be.bignumber.equal('1');
        expect(await this.token.tokenCountOf(receiver)).to.be.bignumber.equal('0');
        expect(await this.token.tokenCountOf(other)).to.be.bignumber.equal('0');

        expect(await this.token.tokenOfOwnerByIndex(holder, 0)).to.be.bignumber.equal(firstTokenId);
      });
    });
  });
});
