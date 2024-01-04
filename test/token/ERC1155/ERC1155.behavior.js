const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { RevertType } = require('../../helpers/enums');
const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC1155() {
  const firstTokenId = 1n;
  const secondTokenId = 2n;
  const unknownTokenId = 3n;

  const firstTokenValue = 1000n;
  const secondTokenValue = 2000n;

  const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61';
  const RECEIVER_BATCH_MAGIC_VALUE = '0xbc197c81';

  beforeEach(async function () {
    [this.recipient, this.proxy, this.alice, this.bruce] = this.otherAccounts;
  });

  describe('like an ERC1155', function () {
    describe('balanceOf', function () {
      it('should return 0 when queried about the zero address', async function () {
        expect(await this.token.balanceOf(ethers.ZeroAddress, firstTokenId)).to.equal(0n);
      });

      describe("when accounts don't own tokens", function () {
        it('returns zero for given addresses', async function () {
          expect(await this.token.balanceOf(this.alice, firstTokenId)).to.equal(0n);
          expect(await this.token.balanceOf(this.bruce, secondTokenId)).to.equal(0n);
          expect(await this.token.balanceOf(this.alice, unknownTokenId)).to.equal(0n);
        });
      });

      describe('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.alice, firstTokenId, firstTokenValue, '0x');
          await this.token.$_mint(this.bruce, secondTokenId, secondTokenValue, '0x');
        });

        it('returns the amount of tokens owned by the given addresses', async function () {
          expect(await this.token.balanceOf(this.alice, firstTokenId)).to.equal(firstTokenValue);
          expect(await this.token.balanceOf(this.bruce, secondTokenId)).to.equal(secondTokenValue);
          expect(await this.token.balanceOf(this.alice, unknownTokenId)).to.equal(0n);
        });
      });
    });

    describe('balanceOfBatch', function () {
      it("reverts when input arrays don't match up", async function () {
        const accounts1 = [this.alice, this.bruce, this.alice, this.bruce];
        const ids1 = [firstTokenId, secondTokenId, unknownTokenId];

        await expect(this.token.balanceOfBatch(accounts1, ids1))
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidArrayLength')
          .withArgs(ids1.length, accounts1.length);

        const accounts2 = [this.alice, this.bruce];
        const ids2 = [firstTokenId, secondTokenId, unknownTokenId];
        await expect(this.token.balanceOfBatch(accounts2, ids2))
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidArrayLength')
          .withArgs(ids2.length, accounts2.length);
      });

      it('should return 0 as the balance when one of the addresses is the zero address', async function () {
        const result = await this.token.balanceOfBatch(
          [this.alice, this.bruce, ethers.ZeroAddress],
          [firstTokenId, secondTokenId, unknownTokenId],
        );
        expect(result).to.deep.equal([0n, 0n, 0n]);
      });

      describe("when accounts don't own tokens", function () {
        it('returns zeros for each account', async function () {
          const result = await this.token.balanceOfBatch(
            [this.alice, this.bruce, this.alice],
            [firstTokenId, secondTokenId, unknownTokenId],
          );
          expect(result).to.deep.equal([0n, 0n, 0n]);
        });
      });

      describe('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.alice, firstTokenId, firstTokenValue, '0x');
          await this.token.$_mint(this.bruce, secondTokenId, secondTokenValue, '0x');
        });

        it('returns amounts owned by each account in order passed', async function () {
          const result = await this.token.balanceOfBatch(
            [this.bruce, this.alice, this.alice],
            [secondTokenId, firstTokenId, unknownTokenId],
          );
          expect(result).to.deep.equal([secondTokenValue, firstTokenValue, 0n]);
        });

        it('returns multiple times the balance of the same address when asked', async function () {
          const result = await this.token.balanceOfBatch(
            [this.alice, this.bruce, this.alice],
            [firstTokenId, secondTokenId, firstTokenId],
          );
          expect(result).to.deep.equal([firstTokenValue, secondTokenValue, firstTokenValue]);
        });
      });
    });

    describe('setApprovalForAll', function () {
      beforeEach(async function () {
        this.tx = await this.token.connect(this.holder).setApprovalForAll(this.proxy, true);
      });

      it('sets approval status which can be queried via isApprovedForAll', async function () {
        expect(await this.token.isApprovedForAll(this.holder, this.proxy)).to.be.true;
      });

      it('emits an ApprovalForAll log', async function () {
        await expect(this.tx).to.emit(this.token, 'ApprovalForAll').withArgs(this.holder, this.proxy, true);
      });

      it('can unset approval for an operator', async function () {
        await this.token.connect(this.holder).setApprovalForAll(this.proxy, false);
        expect(await this.token.isApprovedForAll(this.holder, this.proxy)).to.be.false;
      });

      it('reverts if attempting to approve zero address as an operator', async function () {
        await expect(this.token.connect(this.holder).setApprovalForAll(ethers.ZeroAddress, true))
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidOperator')
          .withArgs(ethers.ZeroAddress);
      });
    });

    describe('safeTransferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, firstTokenId, firstTokenValue, '0x');
        await this.token.$_mint(this.holder, secondTokenId, secondTokenValue, '0x');
      });

      it('reverts when transferring more than balance', async function () {
        await expect(
          this.token
            .connect(this.holder)
            .safeTransferFrom(this.holder, this.recipient, firstTokenId, firstTokenValue + 1n, '0x'),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InsufficientBalance')
          .withArgs(this.holder, firstTokenValue, firstTokenValue + 1n, firstTokenId);
      });

      it('reverts when transferring to zero address', async function () {
        await expect(
          this.token
            .connect(this.holder)
            .safeTransferFrom(this.holder, ethers.ZeroAddress, firstTokenId, firstTokenValue, '0x'),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      function transferWasSuccessful() {
        it('debits transferred balance from sender', async function () {
          expect(await this.token.balanceOf(this.args.from, this.args.id)).to.equal(0n);
        });

        it('credits transferred balance to receiver', async function () {
          expect(await this.token.balanceOf(this.args.to, this.args.id)).to.equal(this.args.value);
        });

        it('emits a TransferSingle log', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'TransferSingle')
            .withArgs(this.args.operator, this.args.from, this.args.to, this.args.id, this.args.value);
        });
      }

      describe('when called by the holder', async function () {
        beforeEach(async function () {
          this.args = {
            operator: this.holder,
            from: this.holder,
            to: this.recipient,
            id: firstTokenId,
            value: firstTokenValue,
            data: '0x',
          };
          this.tx = await this.token
            .connect(this.args.operator)
            .safeTransferFrom(this.args.from, this.args.to, this.args.id, this.args.value, this.args.data);
        });

        transferWasSuccessful();

        it('preserves existing balances which are not transferred by holder', async function () {
          expect(await this.token.balanceOf(this.holder, secondTokenId)).to.equal(secondTokenValue);
          expect(await this.token.balanceOf(this.recipient, secondTokenId)).to.equal(0n);
        });
      });

      describe('when called by an operator on behalf of the holder', function () {
        describe('when operator is not approved by holder', function () {
          beforeEach(async function () {
            await this.token.connect(this.holder).setApprovalForAll(this.proxy, false);
          });

          it('reverts', async function () {
            await expect(
              this.token
                .connect(this.proxy)
                .safeTransferFrom(this.holder, this.recipient, firstTokenId, firstTokenValue, '0x'),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC1155MissingApprovalForAll')
              .withArgs(this.proxy, this.holder);
          });
        });

        describe('when operator is approved by holder', function () {
          beforeEach(async function () {
            await this.token.connect(this.holder).setApprovalForAll(this.proxy, true);

            this.args = {
              operator: this.proxy,
              from: this.holder,
              to: this.recipient,
              id: firstTokenId,
              value: firstTokenValue,
              data: '0x',
            };
            this.tx = await this.token
              .connect(this.args.operator)
              .safeTransferFrom(this.args.from, this.args.to, this.args.id, this.args.value, this.args.data);
          });

          transferWasSuccessful();

          it("preserves operator's balances not involved in the transfer", async function () {
            expect(await this.token.balanceOf(this.proxy, firstTokenId)).to.equal(0n);
            expect(await this.token.balanceOf(this.proxy, secondTokenId)).to.equal(0n);
          });
        });
      });

      describe('when sending to a valid receiver', function () {
        beforeEach(async function () {
          this.receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
            RECEIVER_SINGLE_MAGIC_VALUE,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          ]);
        });

        describe('without data', function () {
          beforeEach(async function () {
            this.args = {
              operator: this.holder,
              from: this.holder,
              to: this.receiver,
              id: firstTokenId,
              value: firstTokenValue,
              data: '0x',
            };
            this.tx = await this.token
              .connect(this.args.operator)
              .safeTransferFrom(this.args.from, this.args.to, this.args.id, this.args.value, this.args.data);
          });

          transferWasSuccessful();

          it('calls onERC1155Received', async function () {
            await expect(this.tx)
              .to.emit(this.receiver, 'Received')
              .withArgs(this.args.operator, this.args.from, this.args.id, this.args.value, this.args.data, anyValue);
          });
        });

        describe('with data', function () {
          beforeEach(async function () {
            this.args = {
              operator: this.holder,
              from: this.holder,
              to: this.receiver,
              id: firstTokenId,
              value: firstTokenValue,
              data: '0xf00dd00d',
            };
            this.tx = await this.token
              .connect(this.args.operator)
              .safeTransferFrom(this.args.from, this.args.to, this.args.id, this.args.value, this.args.data);
          });

          transferWasSuccessful();

          it('calls onERC1155Received', async function () {
            await expect(this.tx)
              .to.emit(this.receiver, 'Received')
              .withArgs(this.args.operator, this.args.from, this.args.id, this.args.value, this.args.data, anyValue);
          });
        });
      });

      describe('to a receiver contract returning unexpected value', function () {
        it('reverts', async function () {
          const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
            '0x00c0ffee',
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          ]);

          await expect(
            this.token
              .connect(this.holder)
              .safeTransferFrom(this.holder, receiver, firstTokenId, firstTokenValue, '0x'),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
            .withArgs(receiver);
        });
      });

      describe('to a receiver contract that reverts', function () {
        describe('with a revert string', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithMessage,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeTransferFrom(this.holder, receiver, firstTokenId, firstTokenValue, '0x'),
            ).to.be.revertedWith('ERC1155ReceiverMock: reverting on receive');
          });
        });

        describe('without a revert string', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeTransferFrom(this.holder, receiver, firstTokenId, firstTokenValue, '0x'),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
              .withArgs(receiver);
          });
        });

        describe('with a custom error', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeTransferFrom(this.holder, receiver, firstTokenId, firstTokenValue, '0x'),
            )
              .to.be.revertedWithCustomError(receiver, 'CustomError')
              .withArgs(RECEIVER_SINGLE_MAGIC_VALUE);
          });
        });

        describe('with a panic', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.Panic,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeTransferFrom(this.holder, receiver, firstTokenId, firstTokenValue, '0x'),
            ).to.be.revertedWithPanic();
          });
        });
      });

      describe('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const invalidReceiver = this.token;

          await expect(
            this.token
              .connect(this.holder)
              .safeTransferFrom(this.holder, invalidReceiver, firstTokenId, firstTokenValue, '0x'),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
            .withArgs(invalidReceiver);
        });
      });
    });

    describe('safeBatchTransferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, firstTokenId, firstTokenValue, '0x');
        await this.token.$_mint(this.holder, secondTokenId, secondTokenValue, '0x');
      });

      it('reverts when transferring value more than any of balances', async function () {
        await expect(
          this.token
            .connect(this.holder)
            .safeBatchTransferFrom(
              this.holder,
              this.recipient,
              [firstTokenId, secondTokenId],
              [firstTokenValue, secondTokenValue + 1n],
              '0x',
            ),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InsufficientBalance')
          .withArgs(this.holder, secondTokenValue, secondTokenValue + 1n, secondTokenId);
      });

      it("reverts when ids array length doesn't match values array length", async function () {
        const ids1 = [firstTokenId];
        const tokenValues1 = [firstTokenValue, secondTokenValue];

        await expect(
          this.token.connect(this.holder).safeBatchTransferFrom(this.holder, this.recipient, ids1, tokenValues1, '0x'),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidArrayLength')
          .withArgs(ids1.length, tokenValues1.length);

        const ids2 = [firstTokenId, secondTokenId];
        const tokenValues2 = [firstTokenValue];

        await expect(
          this.token.connect(this.holder).safeBatchTransferFrom(this.holder, this.recipient, ids2, tokenValues2, '0x'),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidArrayLength')
          .withArgs(ids2.length, tokenValues2.length);
      });

      it('reverts when transferring to zero address', async function () {
        await expect(
          this.token
            .connect(this.holder)
            .safeBatchTransferFrom(
              this.holder,
              ethers.ZeroAddress,
              [firstTokenId, secondTokenId],
              [firstTokenValue, secondTokenValue],
              '0x',
            ),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      it('reverts when transferring from zero address', async function () {
        await expect(
          this.token.$_safeBatchTransferFrom(ethers.ZeroAddress, this.holder, [firstTokenId], [firstTokenValue], '0x'),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidSender')
          .withArgs(ethers.ZeroAddress);
      });

      function batchTransferWasSuccessful() {
        it('debits transferred balances from sender', async function () {
          const newBalances = await this.token.balanceOfBatch(
            this.args.ids.map(() => this.args.from),
            this.args.ids,
          );
          expect(newBalances).to.deep.equal(this.args.ids.map(() => 0n));
        });

        it('credits transferred balances to receiver', async function () {
          const newBalances = await this.token.balanceOfBatch(
            this.args.ids.map(() => this.args.to),
            this.args.ids,
          );
          expect(newBalances).to.deep.equal(this.args.values);
        });

        it('emits a TransferBatch log', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'TransferBatch')
            .withArgs(this.args.operator, this.args.from, this.args.to, this.args.ids, this.args.values);
        });
      }

      describe('when called by the holder', async function () {
        beforeEach(async function () {
          this.args = {
            operator: this.holder,
            from: this.holder,
            to: this.recipient,
            ids: [firstTokenId, secondTokenId],
            values: [firstTokenValue, secondTokenValue],
            data: '0x',
          };
          this.tx = await this.token
            .connect(this.args.operator)
            .safeBatchTransferFrom(this.args.from, this.args.to, this.args.ids, this.args.values, this.args.data);
        });

        batchTransferWasSuccessful();
      });

      describe('when called by an operator on behalf of the holder', function () {
        describe('when operator is not approved by holder', function () {
          beforeEach(async function () {
            await this.token.connect(this.holder).setApprovalForAll(this.proxy, false);
          });

          it('reverts', async function () {
            await expect(
              this.token
                .connect(this.proxy)
                .safeBatchTransferFrom(
                  this.holder,
                  this.recipient,
                  [firstTokenId, secondTokenId],
                  [firstTokenValue, secondTokenValue],
                  '0x',
                ),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC1155MissingApprovalForAll')
              .withArgs(this.proxy, this.holder);
          });
        });

        describe('when operator is approved by holder', function () {
          beforeEach(async function () {
            await this.token.connect(this.holder).setApprovalForAll(this.proxy, true);

            this.args = {
              operator: this.proxy,
              from: this.holder,
              to: this.recipient,
              ids: [firstTokenId, secondTokenId],
              values: [firstTokenValue, secondTokenValue],
              data: '0x',
            };
            this.tx = await this.token
              .connect(this.args.operator)
              .safeBatchTransferFrom(this.args.from, this.args.to, this.args.ids, this.args.values, this.args.data);
          });

          batchTransferWasSuccessful();

          it("preserves operator's balances not involved in the transfer", async function () {
            expect(await this.token.balanceOf(this.proxy, firstTokenId)).to.equal(0n);
            expect(await this.token.balanceOf(this.proxy, secondTokenId)).to.equal(0n);
          });
        });
      });

      describe('when sending to a valid receiver', function () {
        beforeEach(async function () {
          this.receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
            RECEIVER_SINGLE_MAGIC_VALUE,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          ]);
        });

        describe('without data', function () {
          beforeEach(async function () {
            this.args = {
              operator: this.holder,
              from: this.holder,
              to: this.receiver,
              ids: [firstTokenId, secondTokenId],
              values: [firstTokenValue, secondTokenValue],
              data: '0x',
            };
            this.tx = await this.token
              .connect(this.args.operator)
              .safeBatchTransferFrom(this.args.from, this.args.to, this.args.ids, this.args.values, this.args.data);
          });

          batchTransferWasSuccessful();

          it('calls onERC1155BatchReceived', async function () {
            await expect(this.tx)
              .to.emit(this.receiver, 'BatchReceived')
              .withArgs(this.holder, this.holder, this.args.ids, this.args.values, this.args.data, anyValue);
          });
        });

        describe('with data', function () {
          beforeEach(async function () {
            this.args = {
              operator: this.holder,
              from: this.holder,
              to: this.receiver,
              ids: [firstTokenId, secondTokenId],
              values: [firstTokenValue, secondTokenValue],
              data: '0xf00dd00d',
            };
            this.tx = await this.token
              .connect(this.args.operator)
              .safeBatchTransferFrom(this.args.from, this.args.to, this.args.ids, this.args.values, this.args.data);
          });

          batchTransferWasSuccessful();

          it('calls onERC1155Received', async function () {
            await expect(this.tx)
              .to.emit(this.receiver, 'BatchReceived')
              .withArgs(this.holder, this.holder, this.args.ids, this.args.values, this.args.data, anyValue);
          });
        });
      });

      describe('to a receiver contract returning unexpected value', function () {
        it('reverts', async function () {
          const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
            RECEIVER_SINGLE_MAGIC_VALUE,
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
          ]);

          await expect(
            this.token
              .connect(this.holder)
              .safeBatchTransferFrom(
                this.holder,
                receiver,
                [firstTokenId, secondTokenId],
                [firstTokenValue, secondTokenValue],
                '0x',
              ),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
            .withArgs(receiver);
        });
      });

      describe('to a receiver contract that reverts', function () {
        describe('with a revert string', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithMessage,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeBatchTransferFrom(
                  this.holder,
                  receiver,
                  [firstTokenId, secondTokenId],
                  [firstTokenValue, secondTokenValue],
                  '0x',
                ),
            ).to.be.revertedWith('ERC1155ReceiverMock: reverting on batch receive');
          });
        });

        describe('without a revert string', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeBatchTransferFrom(
                  this.holder,
                  receiver,
                  [firstTokenId, secondTokenId],
                  [firstTokenValue, secondTokenValue],
                  '0x',
                ),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
              .withArgs(receiver);
          });
        });

        describe('with a custom error', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeBatchTransferFrom(
                  this.holder,
                  receiver,
                  [firstTokenId, secondTokenId],
                  [firstTokenValue, secondTokenValue],
                  '0x',
                ),
            )
              .to.be.revertedWithCustomError(receiver, 'CustomError')
              .withArgs(RECEIVER_SINGLE_MAGIC_VALUE);
          });
        });

        describe('with a panic', function () {
          it('reverts', async function () {
            const receiver = await ethers.deployContract('$ERC1155ReceiverMock', [
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.Panic,
            ]);

            await expect(
              this.token
                .connect(this.holder)
                .safeBatchTransferFrom(
                  this.holder,
                  receiver,
                  [firstTokenId, secondTokenId],
                  [firstTokenValue, secondTokenValue],
                  '0x',
                ),
            ).to.be.revertedWithPanic();
          });
        });
      });

      describe('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const invalidReceiver = this.token;

          await expect(
            this.token
              .connect(this.holder)
              .safeBatchTransferFrom(
                this.holder,
                invalidReceiver,
                [firstTokenId, secondTokenId],
                [firstTokenValue, secondTokenValue],
                '0x',
              ),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC1155InvalidReceiver')
            .withArgs(invalidReceiver);
        });
      });
    });

    shouldSupportInterfaces(['ERC1155', 'ERC1155MetadataURI']);
  });
}

module.exports = {
  shouldBehaveLikeERC1155,
};
