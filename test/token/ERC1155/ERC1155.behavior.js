const { BN, constants, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC1155 ([minter, firstOwner, secondOwner]) {
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const unknownTokenId = new BN(3);

  const firstAmount = new BN(1000);
  const secondAmount = new BN(2000);

  describe('like an ERC1155', function () {
    describe('balanceOf', function () {
      it('reverts when queried about the zero address', async function () {
        await expectRevert(
          this.token.balanceOf(ZERO_ADDRESS, firstTokenId),
          'ERC1155: balance query for the zero address'
        );
      });

      context('when accounts don\'t own tokens', function () {
        it('returns zero for given addresses', async function () {
          (await this.token.balanceOf(
            firstOwner,
            firstTokenId
          )).should.be.bignumber.equal('0');

          (await this.token.balanceOf(
            secondOwner,
            secondTokenId
          )).should.be.bignumber.equal('0');

          (await this.token.balanceOf(
            firstOwner,
            unknownTokenId
          )).should.be.bignumber.equal('0');
        });
      });

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.mint(firstOwner, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.mint(
            secondOwner,
            secondTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            }
          );
        });

        it('returns the amount of tokens owned by the given addresses', async function () {
          (await this.token.balanceOf(
            firstOwner,
            firstTokenId
          )).should.be.bignumber.equal(firstAmount);

          (await this.token.balanceOf(
            secondOwner,
            secondTokenId
          )).should.be.bignumber.equal(secondAmount);

          (await this.token.balanceOf(
            firstOwner,
            unknownTokenId
          )).should.be.bignumber.equal('0');
        });
      });
    });

    describe('balanceOfBatch', function () {
      it('reverts when input arrays don\'t match up', async function () {
        await expectRevert(
          this.token.balanceOfBatch(
            [firstOwner, secondOwner, firstOwner, secondOwner],
            [firstTokenId, secondTokenId, unknownTokenId]
          ),
          'ERC1155: owners and IDs must have same lengths'
        );
      });

      it('reverts when one of the addresses is the zero address', async function () {
        await expectRevert(
          this.token.balanceOfBatch(
            [firstOwner, secondOwner, ZERO_ADDRESS],
            [firstTokenId, secondTokenId, unknownTokenId]
          ),
          'ERC1155: some address in batch balance query is zero'
        );
      });

      context('when accounts don\'t own tokens', function () {
        it('returns zeros for each account', async function () {
          const result = await this.token.balanceOfBatch(
            [firstOwner, secondOwner, firstOwner],
            [firstTokenId, secondTokenId, unknownTokenId]
          );
          result.should.be.an('array');
          result[0].should.be.a.bignumber.equal('0');
          result[1].should.be.a.bignumber.equal('0');
          result[2].should.be.a.bignumber.equal('0');
        });
      });

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.mint(firstOwner, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.mint(
            secondOwner,
            secondTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            }
          );
        });

        it('returns amounts owned by each account in order passed', async function () {
          const result = await this.token.balanceOfBatch(
            [secondOwner, firstOwner, firstOwner],
            [secondTokenId, firstTokenId, unknownTokenId]
          );
          result.should.be.an('array');
          result[0].should.be.a.bignumber.equal(secondAmount);
          result[1].should.be.a.bignumber.equal(firstAmount);
          result[2].should.be.a.bignumber.equal('0');
        });
      });
    });

    shouldSupportInterfaces(['ERC165', 'ERC1155']);
  });
}

module.exports = {
  shouldBehaveLikeERC1155,
};
