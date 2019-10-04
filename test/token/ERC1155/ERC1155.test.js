const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const { shouldBehaveLikeERC1155 } = require('./ERC1155.behavior');
const ERC1155Mock = artifacts.require('ERC1155Mock');

contract('ERC1155', function ([, creator, tokenHolder, ...accounts]) {
  beforeEach(async function () {
    this.token = await ERC1155Mock.new({ from: creator });
  });

  shouldBehaveLikeERC1155(accounts);

  describe('internal functions', function () {
    const tokenId = new BN(1990);
    const mintAmount = new BN(9001);
    const burnAmount = new BN(3000);
    const data = '0xcafebabe';

    describe('_mint(address, uint256, uint256, bytes memory)', function () {
      it('reverts with a null destination address', async function () {
        await expectRevert(
          this.token.mint(ZERO_ADDRESS, tokenId, mintAmount, data),
          'ERC1155: mint to the zero address'
        );
      });

      context('with minted tokens', function () {
        beforeEach(async function () {
          ({ logs: this.logs } = await this.token.mint(
            tokenHolder,
            tokenId,
            mintAmount,
            data,
            { from: creator }
          ));
        });

        it('emits a TransferSingle event', function () {
          expectEvent.inLogs(this.logs, 'TransferSingle', {
            operator: creator,
            from: ZERO_ADDRESS,
            to: tokenHolder,
            id: tokenId,
            value: mintAmount,
          });
        });

        it('credits the minted amount of tokens', async function () {
          (await this.token.balanceOf(
            tokenHolder,
            tokenId
          )).should.be.bignumber.equal(mintAmount);
        });
      });
    });

    describe('_burn(address, uint256, uint256)', function () {
      it('reverts when burning the zero account\'s tokens', async function () {
        await expectRevert(
          this.token.burn(ZERO_ADDRESS, tokenId, mintAmount),
          'ERC1155: attempting to burn tokens on zero account'
        );
      });

      it('reverts when burning a non-existent token id', async function () {
        await expectRevert(
          this.token.burn(tokenHolder, tokenId, mintAmount),
          'ERC1155: attempting to burn more than balance'
        );
      });

      context('with minted-then-burnt tokens', function () {
        beforeEach(async function () {
          await this.token.mint(tokenHolder, tokenId, mintAmount, data);
          ({ logs: this.logs } = await this.token.burn(
            tokenHolder,
            tokenId,
            burnAmount,
            { from: creator }
          ));
        });

        it('emits a TransferSingle event', function () {
          expectEvent.inLogs(this.logs, 'TransferSingle', {
            operator: creator,
            from: tokenHolder,
            to: ZERO_ADDRESS,
            id: tokenId,
            value: burnAmount,
          });
        });

        it('accounts for both minting and burning', async function () {
          (await this.token.balanceOf(
            tokenHolder,
            tokenId
          )).should.be.bignumber.equal(mintAmount.sub(burnAmount));
        });
      });
    });
  });
});
