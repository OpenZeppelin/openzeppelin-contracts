const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC721Mock = artifacts.require('ERC721Mock');

contract('ERC721Rent', function (accounts) {
  const [owner] = accounts;

  const tokenId = new BN(1);

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  beforeEach(async function () {
    this.token = await ERC721Mock.new(name, symbol);
    await this.token.mint(owner, tokenId);
  });

  describe('a contract with no agreement cannot be rented', function () {
    it('is not rented', async function () {
      expect(await this.token.isRented(tokenId)).to.equal(false);
    });

    it('has no agreement contract', async function () {
      expect(await this.token.rentAggreementOf(tokenId)).to.equal('0x0000000000000000000000000000000000000000');
    });

    it('cannot be rented', async function () {
      await expectRevert(this.token.acceptRentAgreement(tokenId), 'ERC721: rent without rent agreement');
    });

    it('cannot stop being rented', async function () {
      await expectRevert(this.token.stopRentAgreement(tokenId), 'ERC721: token is not rented');
    });
  });
});
