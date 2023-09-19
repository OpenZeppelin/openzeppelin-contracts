const { BN, constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const { ZERO_ADDRESS } = constants;

const ERC1155Supply = artifacts.require('$ERC1155Supply');

contract('ERC1155Supply', function (accounts) {
  const [holder] = accounts;

  const uri = 'https://token.com';

  const firstTokenId = new BN('37');
  const firstTokenValue = new BN('42');

  const secondTokenId = new BN('19842');
  const secondTokenValue = new BN('23');

  beforeEach(async function () {
    this.token = await ERC1155Supply.new(uri);
  });

  context('before mint', function () {
    it('exist', async function () {
      expect(await this.token.exists(firstTokenId)).to.be.equal(false);
    });

    it('totalSupply', async function () {
      expect(await this.token.methods['totalSupply(uint256)'](firstTokenId)).to.be.bignumber.equal('0');
      expect(await this.token.methods['totalSupply()']()).to.be.bignumber.equal('0');
    });
  });

  context('after mint', function () {
    context('single', function () {
      beforeEach(async function () {
        await this.token.$_mint(holder, firstTokenId, firstTokenValue, '0x');
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(true);
      });

      it('totalSupply', async function () {
        expect(await this.token.methods['totalSupply(uint256)'](firstTokenId)).to.be.bignumber.equal(firstTokenValue);
        expect(await this.token.methods['totalSupply()']()).to.be.bignumber.equal(firstTokenValue);
      });
    });

    context('batch', function () {
      beforeEach(async function () {
        await this.token.$_mintBatch(holder, [firstTokenId, secondTokenId], [firstTokenValue, secondTokenValue], '0x');
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(true);
        expect(await this.token.exists(secondTokenId)).to.be.equal(true);
      });

      it('totalSupply', async function () {
        expect(await this.token.methods['totalSupply(uint256)'](firstTokenId)).to.be.bignumber.equal(firstTokenValue);
        expect(await this.token.methods['totalSupply(uint256)'](secondTokenId)).to.be.bignumber.equal(secondTokenValue);
        expect(await this.token.methods['totalSupply()']()).to.be.bignumber.equal(
          firstTokenValue.add(secondTokenValue),
        );
      });
    });
  });

  context('after burn', function () {
    context('single', function () {
      beforeEach(async function () {
        await this.token.$_mint(holder, firstTokenId, firstTokenValue, '0x');
        await this.token.$_burn(holder, firstTokenId, firstTokenValue);
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(false);
      });

      it('totalSupply', async function () {
        expect(await this.token.methods['totalSupply(uint256)'](firstTokenId)).to.be.bignumber.equal('0');
        expect(await this.token.methods['totalSupply()']()).to.be.bignumber.equal('0');
      });
    });

    context('batch', function () {
      beforeEach(async function () {
        await this.token.$_mintBatch(holder, [firstTokenId, secondTokenId], [firstTokenValue, secondTokenValue], '0x');
        await this.token.$_burnBatch(holder, [firstTokenId, secondTokenId], [firstTokenValue, secondTokenValue]);
      });

      it('exist', async function () {
        expect(await this.token.exists(firstTokenId)).to.be.equal(false);
        expect(await this.token.exists(secondTokenId)).to.be.equal(false);
      });

      it('totalSupply', async function () {
        expect(await this.token.methods['totalSupply(uint256)'](firstTokenId)).to.be.bignumber.equal('0');
        expect(await this.token.methods['totalSupply(uint256)'](secondTokenId)).to.be.bignumber.equal('0');
        expect(await this.token.methods['totalSupply()']()).to.be.bignumber.equal('0');
      });
    });
  });

  context('other', function () {
    it('supply unaffected by no-op', async function () {
      this.token.safeTransferFrom(ZERO_ADDRESS, ZERO_ADDRESS, firstTokenId, firstTokenValue, '0x', {
        from: ZERO_ADDRESS,
      });
      expect(await this.token.methods['totalSupply(uint256)'](firstTokenId)).to.be.bignumber.equal('0');
      expect(await this.token.methods['totalSupply()']()).to.be.bignumber.equal('0');
    });
  });
});
