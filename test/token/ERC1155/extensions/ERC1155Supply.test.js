const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC1155SupplyMock = artifacts.require('ERC1155SupplyMock');

contract('ERC1155Supply', function (accounts) {
  const [ holder ] = accounts;

  const uri = 'https://token.com';

  const firstTokenId = new BN('37');
  const firstTokenAmount = new BN('42');

  const secondTokenId = new BN('19842');
  const secondTokenAmount = new BN('23');

  beforeEach(async function () {
    this.token = await ERC1155SupplyMock.new(uri);
  });

  context('before mint', function () {
    it('exist', async function () {
      expect(await this.token.exists(firstTokenId)).to.be.equal(false);
    });

    it('totalSupply', async function () {
      expect(await this.token.totalSupply(firstTokenId)).to.be.bignumber.equal('0');
    });
  });

  context('after mint', function () {
    context('single', function () {
      beforeEach(async function () {
        await this.token.mint(holder, firstTokenId, firstTokenAmount, '0x');
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(true);
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.be.bignumber.equal(firstTokenAmount);
      });
    });

    context('batch', function () {
      beforeEach(async function () {
        await this.token.mintBatch(
          holder,
          [ firstTokenId, secondTokenId ],
          [ firstTokenAmount, secondTokenAmount ],
          '0x',
        );
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(true);
        expect(await this.token.exists(secondTokenId)).to.be.equal(true);
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.be.bignumber.equal(firstTokenAmount);
        expect(await this.token.totalSupply(secondTokenId)).to.be.bignumber.equal(secondTokenAmount);
      });
    });
  });

  context('after burn', function () {
    context('single', function () {
      beforeEach(async function () {
        await this.token.mint(holder, firstTokenId, firstTokenAmount, '0x');
        await this.token.burn(holder, firstTokenId, firstTokenAmount);
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(false);
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.be.bignumber.equal('0');
      });
    });

    context('batch', function () {
      beforeEach(async function () {
        await this.token.mintBatch(
          holder,
          [ firstTokenId, secondTokenId ],
          [ firstTokenAmount, secondTokenAmount ],
          '0x',
        );
        await this.token.burnBatch(
          holder,
          [ firstTokenId, secondTokenId ],
          [ firstTokenAmount, secondTokenAmount ],
        );
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(false);
        expect(await this.token.exists(secondTokenId)).to.be.equal(false);
      });

      it('totalSupply', async function () {
        expect(await this.token.totalSupply(firstTokenId)).to.be.bignumber.equal('0');
        expect(await this.token.totalSupply(secondTokenId)).to.be.bignumber.equal('0');
      });
    });
  });
});
