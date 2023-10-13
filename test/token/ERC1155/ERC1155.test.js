const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const { expectRevertCustomError } = require('../../helpers/customError');

const { shouldBehaveLikeERC1155 } = require('./ERC1155.behavior');
const ERC1155Mock = artifacts.require('$ERC1155');

contract('ERC1155', function (accounts) {
  const [operator, tokenHolder, tokenBatchHolder, ...otherAccounts] = accounts;

  const initialURI = 'https://token-cdn-domain/{id}.json';

  beforeEach(async function () {
    this.token = await ERC1155Mock.new(initialURI);
  });

  shouldBehaveLikeERC1155(otherAccounts);

  describe('internal functions', function () {
    const tokenId = new BN(1990);
    const mintValue = new BN(9001);
    const burnValue = new BN(3000);

    const tokenBatchIds = [new BN(2000), new BN(2010), new BN(2020)];
    const mintValues = [new BN(5000), new BN(10000), new BN(42195)];
    const burnValues = [new BN(5000), new BN(9001), new BN(195)];

    const data = '0x12345678';

    describe('_mint', function () {
      it('reverts with a zero destination address', async function () {
        await expectRevertCustomError(
          this.token.$_mint(ZERO_ADDRESS, tokenId, mintValue, data),
          'ERC1155InvalidReceiver',
          [ZERO_ADDRESS],
        );
      });

      context('with minted tokens', function () {
        beforeEach(async function () {
          this.receipt = await this.token.$_mint(tokenHolder, tokenId, mintValue, data, { from: operator });
        });

        it('emits a TransferSingle event', function () {
          expectEvent(this.receipt, 'TransferSingle', {
            operator,
            from: ZERO_ADDRESS,
            to: tokenHolder,
            id: tokenId,
            value: mintValue,
          });
        });

        it('credits the minted token value', async function () {
          expect(await this.token.balanceOf(tokenHolder, tokenId)).to.be.bignumber.equal(mintValue);
        });
      });
    });

    describe('_mintBatch', function () {
      it('reverts with a zero destination address', async function () {
        await expectRevertCustomError(
          this.token.$_mintBatch(ZERO_ADDRESS, tokenBatchIds, mintValues, data),
          'ERC1155InvalidReceiver',
          [ZERO_ADDRESS],
        );
      });

      it('reverts if length of inputs do not match', async function () {
        await expectRevertCustomError(
          this.token.$_mintBatch(tokenBatchHolder, tokenBatchIds, mintValues.slice(1), data),
          'ERC1155InvalidArrayLength',
          [tokenBatchIds.length, mintValues.length - 1],
        );

        await expectRevertCustomError(
          this.token.$_mintBatch(tokenBatchHolder, tokenBatchIds.slice(1), mintValues, data),
          'ERC1155InvalidArrayLength',
          [tokenBatchIds.length - 1, mintValues.length],
        );
      });

      context('with minted batch of tokens', function () {
        beforeEach(async function () {
          this.receipt = await this.token.$_mintBatch(tokenBatchHolder, tokenBatchIds, mintValues, data, {
            from: operator,
          });
        });

        it('emits a TransferBatch event', function () {
          expectEvent(this.receipt, 'TransferBatch', {
            operator,
            from: ZERO_ADDRESS,
            to: tokenBatchHolder,
          });
        });

        it('credits the minted batch of tokens', async function () {
          const holderBatchBalances = await this.token.balanceOfBatch(
            new Array(tokenBatchIds.length).fill(tokenBatchHolder),
            tokenBatchIds,
          );

          for (let i = 0; i < holderBatchBalances.length; i++) {
            expect(holderBatchBalances[i]).to.be.bignumber.equal(mintValues[i]);
          }
        });
      });
    });

    describe('_burn', function () {
      it("reverts when burning the zero account's tokens", async function () {
        await expectRevertCustomError(this.token.$_burn(ZERO_ADDRESS, tokenId, mintValue), 'ERC1155InvalidSender', [
          ZERO_ADDRESS,
        ]);
      });

      it('reverts when burning a non-existent token id', async function () {
        await expectRevertCustomError(
          this.token.$_burn(tokenHolder, tokenId, mintValue),
          'ERC1155InsufficientBalance',
          [tokenHolder, 0, mintValue, tokenId],
        );
      });

      it('reverts when burning more than available tokens', async function () {
        await this.token.$_mint(tokenHolder, tokenId, mintValue, data, { from: operator });

        await expectRevertCustomError(
          this.token.$_burn(tokenHolder, tokenId, mintValue.addn(1)),
          'ERC1155InsufficientBalance',
          [tokenHolder, mintValue, mintValue.addn(1), tokenId],
        );
      });

      context('with minted-then-burnt tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(tokenHolder, tokenId, mintValue, data);
          this.receipt = await this.token.$_burn(tokenHolder, tokenId, burnValue, { from: operator });
        });

        it('emits a TransferSingle event', function () {
          expectEvent(this.receipt, 'TransferSingle', {
            operator,
            from: tokenHolder,
            to: ZERO_ADDRESS,
            id: tokenId,
            value: burnValue,
          });
        });

        it('accounts for both minting and burning', async function () {
          expect(await this.token.balanceOf(tokenHolder, tokenId)).to.be.bignumber.equal(mintValue.sub(burnValue));
        });
      });
    });

    describe('_burnBatch', function () {
      it("reverts when burning the zero account's tokens", async function () {
        await expectRevertCustomError(
          this.token.$_burnBatch(ZERO_ADDRESS, tokenBatchIds, burnValues),
          'ERC1155InvalidSender',
          [ZERO_ADDRESS],
        );
      });

      it('reverts if length of inputs do not match', async function () {
        await expectRevertCustomError(
          this.token.$_burnBatch(tokenBatchHolder, tokenBatchIds, burnValues.slice(1)),
          'ERC1155InvalidArrayLength',
          [tokenBatchIds.length, burnValues.length - 1],
        );

        await expectRevertCustomError(
          this.token.$_burnBatch(tokenBatchHolder, tokenBatchIds.slice(1), burnValues),
          'ERC1155InvalidArrayLength',
          [tokenBatchIds.length - 1, burnValues.length],
        );
      });

      it('reverts when burning a non-existent token id', async function () {
        await expectRevertCustomError(
          this.token.$_burnBatch(tokenBatchHolder, tokenBatchIds, burnValues),
          'ERC1155InsufficientBalance',
          [tokenBatchHolder, 0, tokenBatchIds[0], burnValues[0]],
        );
      });

      context('with minted-then-burnt tokens', function () {
        beforeEach(async function () {
          await this.token.$_mintBatch(tokenBatchHolder, tokenBatchIds, mintValues, data);
          this.receipt = await this.token.$_burnBatch(tokenBatchHolder, tokenBatchIds, burnValues, { from: operator });
        });

        it('emits a TransferBatch event', function () {
          expectEvent(this.receipt, 'TransferBatch', {
            operator,
            from: tokenBatchHolder,
            to: ZERO_ADDRESS,
            // ids: tokenBatchIds,
            // values: burnValues,
          });
        });

        it('accounts for both minting and burning', async function () {
          const holderBatchBalances = await this.token.balanceOfBatch(
            new Array(tokenBatchIds.length).fill(tokenBatchHolder),
            tokenBatchIds,
          );

          for (let i = 0; i < holderBatchBalances.length; i++) {
            expect(holderBatchBalances[i]).to.be.bignumber.equal(mintValues[i].sub(burnValues[i]));
          }
        });
      });
    });
  });

  describe('ERC1155MetadataURI', function () {
    const firstTokenID = new BN('42');
    const secondTokenID = new BN('1337');

    it('emits no URI event in constructor', async function () {
      await expectEvent.notEmitted.inConstruction(this.token, 'URI');
    });

    it('sets the initial URI for all token types', async function () {
      expect(await this.token.uri(firstTokenID)).to.be.equal(initialURI);
      expect(await this.token.uri(secondTokenID)).to.be.equal(initialURI);
    });

    describe('_setURI', function () {
      const newURI = 'https://token-cdn-domain/{locale}/{id}.json';

      it('emits no URI event', async function () {
        const receipt = await this.token.$_setURI(newURI);

        expectEvent.notEmitted(receipt, 'URI');
      });

      it('sets the new URI for all token types', async function () {
        await this.token.$_setURI(newURI);

        expect(await this.token.uri(firstTokenID)).to.be.equal(newURI);
        expect(await this.token.uri(secondTokenID)).to.be.equal(newURI);
      });
    });
  });
});
