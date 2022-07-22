const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC1155Compatible = artifacts.require('ERC1155CompatibleMock');

contract('ERC1155Compatible', function (accounts) {
  const [holder, operator] = accounts;

  const name = 'Test Token';
  const symbol = 'TEST';
  const uri = 'https://token.com/';

  beforeEach(async function () {
    this.token = await ERC1155Compatible.new(name, symbol, uri);
  });

  context('when creating the token', function () {
    const firstTokenId = new BN('1');
    const firstTokenAmount = new BN('1000');

    beforeEach(async function () {
      await this.token.setApprovalForAll(operator, true, { from: holder });
      await this.token.mint(holder, firstTokenId, firstTokenAmount, '0x');
    });

    it('correctly reports name and symbol', async function () {
      const _name = await this.token.name();
      const _symbol = await this.token.symbol();

      expect(_name).to.equal(name);
      expect(_symbol).to.equal(symbol);
    });

    it('correctly generates URI for a token', async function () {
      const _uri = await this.token.uri(firstTokenId);
      expect(_uri).to.equal(uri + firstTokenId.toString());
    });
  });
});
