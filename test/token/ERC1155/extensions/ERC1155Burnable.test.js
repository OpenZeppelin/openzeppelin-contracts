const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const { expectRevertCustomError } = require('../../../helpers/customError');

const ERC1155Burnable = artifacts.require('$ERC1155Burnable');

contract('ERC1155Burnable', function (accounts) {
  const [holder, operator, other] = accounts;

  const uri = 'https://token.com';

  const tokenIds = [new BN('42'), new BN('1137')];
  const values = [new BN('3000'), new BN('9902')];

  beforeEach(async function () {
    this.token = await ERC1155Burnable.new(uri);

    await this.token.$_mint(holder, tokenIds[0], values[0], '0x');
    await this.token.$_mint(holder, tokenIds[1], values[1], '0x');
  });

  describe('burn', function () {
    it('holder can burn their tokens', async function () {
      await this.token.burn(holder, tokenIds[0], values[0].subn(1), { from: holder });

      expect(await this.token.balanceOf(holder, tokenIds[0])).to.be.bignumber.equal('1');
    });

    it("approved operators can burn the holder's tokens", async function () {
      await this.token.setApprovalForAll(operator, true, { from: holder });
      await this.token.burn(holder, tokenIds[0], values[0].subn(1), { from: operator });

      expect(await this.token.balanceOf(holder, tokenIds[0])).to.be.bignumber.equal('1');
    });

    it("unapproved accounts cannot burn the holder's tokens", async function () {
      await expectRevertCustomError(
        this.token.burn(holder, tokenIds[0], values[0].subn(1), { from: other }),
        'ERC1155MissingApprovalForAll',
        [other, holder],
      );
    });
  });

  describe('burnBatch', function () {
    it('holder can burn their tokens', async function () {
      await this.token.burnBatch(holder, tokenIds, [values[0].subn(1), values[1].subn(2)], { from: holder });

      expect(await this.token.balanceOf(holder, tokenIds[0])).to.be.bignumber.equal('1');
      expect(await this.token.balanceOf(holder, tokenIds[1])).to.be.bignumber.equal('2');
    });

    it("approved operators can burn the holder's tokens", async function () {
      await this.token.setApprovalForAll(operator, true, { from: holder });
      await this.token.burnBatch(holder, tokenIds, [values[0].subn(1), values[1].subn(2)], { from: operator });

      expect(await this.token.balanceOf(holder, tokenIds[0])).to.be.bignumber.equal('1');
      expect(await this.token.balanceOf(holder, tokenIds[1])).to.be.bignumber.equal('2');
    });

    it("unapproved accounts cannot burn the holder's tokens", async function () {
      await expectRevertCustomError(
        this.token.burnBatch(holder, tokenIds, [values[0].subn(1), values[1].subn(2)], { from: other }),
        'ERC1155MissingApprovalForAll',
        [other, holder],
      );
    });
  });
});
