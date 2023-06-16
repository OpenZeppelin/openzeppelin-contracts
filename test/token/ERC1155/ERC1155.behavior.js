const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');
const { expectRevertCustomError } = require('../../helpers/customError');
const { Enum } = require('../../helpers/enums');

const ERC1155ReceiverMock = artifacts.require('ERC1155ReceiverMock');
const RevertType = Enum('None', 'Empty', 'String', 'Custom');

function shouldBehaveLikeERC1155([minter, firstTokenHolder, secondTokenHolder, multiTokenHolder, recipient, proxy]) {
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const unknownTokenId = new BN(3);

  const firstAmount = new BN(1000);
  const secondAmount = new BN(2000);

  const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61';
  const RECEIVER_BATCH_MAGIC_VALUE = '0xbc197c81';

  describe('like an ERC1155', function () {
    describe('balanceOf', function () {
      it('should return 0 when queried about the zero address', async function () {
        expect(await this.token.balanceOf(ZERO_ADDRESS, firstTokenId)).to.be.bignumber.equal('0');
      });

      context("when accounts don't own tokens", function () {
        it('returns zero for given addresses', async function () {
          expect(await this.token.balanceOf(firstTokenHolder, firstTokenId)).to.be.bignumber.equal('0');

          expect(await this.token.balanceOf(secondTokenHolder, secondTokenId)).to.be.bignumber.equal('0');

          expect(await this.token.balanceOf(firstTokenHolder, unknownTokenId)).to.be.bignumber.equal('0');
        });
      });

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.$_mint(secondTokenHolder, secondTokenId, secondAmount, '0x', {
            from: minter,
          });
        });

        it('returns the amount of tokens owned by the given addresses', async function () {
          expect(await this.token.balanceOf(firstTokenHolder, firstTokenId)).to.be.bignumber.equal(firstAmount);

          expect(await this.token.balanceOf(secondTokenHolder, secondTokenId)).to.be.bignumber.equal(secondAmount);

          expect(await this.token.balanceOf(firstTokenHolder, unknownTokenId)).to.be.bignumber.equal('0');
        });
      });
    });

    describe('balanceOfBatch', function () {
      it("reverts when input arrays don't match up", async function () {
        const accounts1 = [firstTokenHolder, secondTokenHolder, firstTokenHolder, secondTokenHolder];
        const ids1 = [firstTokenId, secondTokenId, unknownTokenId];
        await expectRevertCustomError(this.token.balanceOfBatch(accounts1, ids1), 'ERC1155InvalidArrayLength', [
          accounts1.length,
          ids1.length,
        ]);

        const accounts2 = [firstTokenHolder, secondTokenHolder];
        const ids2 = [firstTokenId, secondTokenId, unknownTokenId];
        await expectRevertCustomError(this.token.balanceOfBatch(accounts2, ids2), 'ERC1155InvalidArrayLength', [
          accounts2.length,
          ids2.length,
        ]);
      });

      it('should return 0 as the balance when one of the addresses is the zero address', async function () {
        const result = await this.token.balanceOfBatch(
          [firstTokenHolder, secondTokenHolder, ZERO_ADDRESS],
          [firstTokenId, secondTokenId, unknownTokenId],
        );
        expect(result).to.be.an('array');
        expect(result[0]).to.be.a.bignumber.equal('0');
        expect(result[1]).to.be.a.bignumber.equal('0');
        expect(result[2]).to.be.a.bignumber.equal('0');
      });

      context("when accounts don't own tokens", function () {
        it('returns zeros for each account', async function () {
          const result = await this.token.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, firstTokenHolder],
            [firstTokenId, secondTokenId, unknownTokenId],
          );
          expect(result).to.be.an('array');
          expect(result[0]).to.be.a.bignumber.equal('0');
          expect(result[1]).to.be.a.bignumber.equal('0');
          expect(result[2]).to.be.a.bignumber.equal('0');
        });
      });

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.$_mint(secondTokenHolder, secondTokenId, secondAmount, '0x', {
            from: minter,
          });
        });

        it('returns amounts owned by each account in order passed', async function () {
          const result = await this.token.balanceOfBatch(
            [secondTokenHolder, firstTokenHolder, firstTokenHolder],
            [secondTokenId, firstTokenId, unknownTokenId],
          );
          expect(result).to.be.an('array');
          expect(result[0]).to.be.a.bignumber.equal(secondAmount);
          expect(result[1]).to.be.a.bignumber.equal(firstAmount);
          expect(result[2]).to.be.a.bignumber.equal('0');
        });

        it('returns multiple times the balance of the same address when asked', async function () {
          const result = await this.token.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, firstTokenHolder],
            [firstTokenId, secondTokenId, firstTokenId],
          );
          expect(result).to.be.an('array');
          expect(result[0]).to.be.a.bignumber.equal(result[2]);
          expect(result[0]).to.be.a.bignumber.equal(firstAmount);
          expect(result[1]).to.be.a.bignumber.equal(secondAmount);
          expect(result[2]).to.be.a.bignumber.equal(firstAmount);
        });
      });
    });

    describe('setApprovalForAll', function () {
      let receipt;
      beforeEach(async function () {
        receipt = await this.token.setApprovalForAll(proxy, true, { from: multiTokenHolder });
      });

      it('sets approval status which can be queried via isApprovedForAll', async function () {
        expect(await this.token.isApprovedForAll(multiTokenHolder, proxy)).to.be.equal(true);
      });

      it('emits an ApprovalForAll log', function () {
        expectEvent(receipt, 'ApprovalForAll', { account: multiTokenHolder, operator: proxy, approved: true });
      });

      it('can unset approval for an operator', async function () {
        await this.token.setApprovalForAll(proxy, false, { from: multiTokenHolder });
        expect(await this.token.isApprovedForAll(multiTokenHolder, proxy)).to.be.equal(false);
      });

      it('reverts if attempting to approve self as an operator', async function () {
        await expectRevertCustomError(
          this.token.setApprovalForAll(multiTokenHolder, true, { from: multiTokenHolder }),
          'ERC1155InvalidOperator',
          [multiTokenHolder],
        );
      });
    });

    describe('safeTransferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(multiTokenHolder, firstTokenId, firstAmount, '0x', {
          from: minter,
        });
        await this.token.$_mint(multiTokenHolder, secondTokenId, secondAmount, '0x', {
          from: minter,
        });
      });

      it('reverts when transferring more than balance', async function () {
        await expectRevertCustomError(
          this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount.addn(1), '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InsufficientBalance',
          [multiTokenHolder, firstAmount, firstAmount.addn(1), firstTokenId],
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevertCustomError(
          this.token.safeTransferFrom(multiTokenHolder, ZERO_ADDRESS, firstTokenId, firstAmount, '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InvalidReceiver',
          [ZERO_ADDRESS],
        );
      });

      function transferWasSuccessful({ operator, from, id, value }) {
        it('debits transferred balance from sender', async function () {
          const newBalance = await this.token.balanceOf(from, id);
          expect(newBalance).to.be.a.bignumber.equal('0');
        });

        it('credits transferred balance to receiver', async function () {
          const newBalance = await this.token.balanceOf(this.toWhom, id);
          expect(newBalance).to.be.a.bignumber.equal(value);
        });

        it('emits a TransferSingle log', function () {
          expectEvent(this.transferLogs, 'TransferSingle', {
            operator,
            from,
            to: this.toWhom,
            id,
            value,
          });
        });
      }

      context('when called by the multiTokenHolder', async function () {
        beforeEach(async function () {
          this.toWhom = recipient;
          this.transferLogs = await this.token.safeTransferFrom(
            multiTokenHolder,
            recipient,
            firstTokenId,
            firstAmount,
            '0x',
            {
              from: multiTokenHolder,
            },
          );
        });

        transferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          id: firstTokenId,
          value: firstAmount,
        });

        it('preserves existing balances which are not transferred by multiTokenHolder', async function () {
          const balance1 = await this.token.balanceOf(multiTokenHolder, secondTokenId);
          expect(balance1).to.be.a.bignumber.equal(secondAmount);

          const balance2 = await this.token.balanceOf(recipient, secondTokenId);
          expect(balance2).to.be.a.bignumber.equal('0');
        });
      });

      context('when called by an operator on behalf of the multiTokenHolder', function () {
        context('when operator is not approved by multiTokenHolder', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(proxy, false, { from: multiTokenHolder });
          });

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
                from: proxy,
              }),
              'ERC1155InsufficientApprovalForAll',
              [proxy, multiTokenHolder],
            );
          });
        });

        context('when operator is approved by multiTokenHolder', function () {
          beforeEach(async function () {
            this.toWhom = recipient;
            await this.token.setApprovalForAll(proxy, true, { from: multiTokenHolder });
            this.transferLogs = await this.token.safeTransferFrom(
              multiTokenHolder,
              recipient,
              firstTokenId,
              firstAmount,
              '0x',
              {
                from: proxy,
              },
            );
          });

          transferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it("preserves operator's balances not involved in the transfer", async function () {
            const balance1 = await this.token.balanceOf(proxy, firstTokenId);
            expect(balance1).to.be.a.bignumber.equal('0');

            const balance2 = await this.token.balanceOf(proxy, secondTokenId);
            expect(balance2).to.be.a.bignumber.equal('0');
          });
        });
      });

      context('when sending to a valid receiver', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );
        });

        context('without data', function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.safeTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              firstTokenId,
              firstAmount,
              '0x',
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it('calls onERC1155Received', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'Received', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstAmount,
              data: null,
            });
          });
        });

        context('with data', function () {
          const data = '0xf00dd00d';
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.safeTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              firstTokenId,
              firstAmount,
              data,
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it('calls onERC1155Received', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'Received', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstAmount,
              data,
            });
          });
        });
      });

      context('to a receiver contract returning unexpected value', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            '0x00c0ffee',
            RevertType.None,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );
        });

        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.safeTransferFrom(multiTokenHolder, this.receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155InvalidReceiver',
            [this.receiver.address],
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        it('with empty reason', async function () {
          const receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.Empty,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );

          await expectRevertCustomError(
            this.token.safeTransferFrom(multiTokenHolder, receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155InvalidReceiver',
            [receiver.address],
          );
        });

        it('with reason string', async function () {
          const receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.String,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );

          await expectRevert(
            this.token.safeTransferFrom(multiTokenHolder, receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155ReceiverMock: reverting on receive',
          );
        });

        it('with custom error', async function () {
          const receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.Custom,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );

          await expectRevertCustomError(
            this.token.safeTransferFrom(multiTokenHolder, receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155ReceiverMockError',
            [],
          );
        });
      });

      context('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const invalidReceiver = this.token;
          await expectRevert.unspecified(
            this.token.safeTransferFrom(multiTokenHolder, invalidReceiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
          );
        });
      });
    });

    describe('safeBatchTransferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(multiTokenHolder, firstTokenId, firstAmount, '0x', {
          from: minter,
        });
        await this.token.$_mint(multiTokenHolder, secondTokenId, secondAmount, '0x', {
          from: minter,
        });
      });

      it('reverts when transferring amount more than any of balances', async function () {
        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(
            multiTokenHolder,
            recipient,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount.addn(1)],
            '0x',
            { from: multiTokenHolder },
          ),
          'ERC1155InsufficientBalance',
          [multiTokenHolder, secondAmount, secondAmount.addn(1), secondTokenId],
        );
      });

      it("reverts when ids array length doesn't match amounts array length", async function () {
        const ids1 = [firstTokenId];
        const amounts1 = [firstAmount, secondAmount];

        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(multiTokenHolder, recipient, ids1, amounts1, '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InvalidArrayLength',
          [ids1.length, amounts1.length],
        );

        const ids2 = [firstTokenId, secondTokenId];
        const amounts2 = [firstAmount];
        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(multiTokenHolder, recipient, ids2, amounts2, '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InvalidArrayLength',
          [ids2.length, amounts2.length],
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(
            multiTokenHolder,
            ZERO_ADDRESS,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x',
            { from: multiTokenHolder },
          ),
          'ERC1155InvalidReceiver',
          [ZERO_ADDRESS],
        );
      });

      it('reverts when transferring from zero address', async function () {
        await expectRevertCustomError(
          this.token.$_safeBatchTransferFrom(ZERO_ADDRESS, multiTokenHolder, [firstTokenId], [firstAmount], '0x'),
          'ERC1155InvalidSender',
          [ZERO_ADDRESS],
        );
      });

      function batchTransferWasSuccessful({ operator, from, ids, values }) {
        it('debits transferred balances from sender', async function () {
          const newBalances = await this.token.balanceOfBatch(new Array(ids.length).fill(from), ids);
          for (const newBalance of newBalances) {
            expect(newBalance).to.be.a.bignumber.equal('0');
          }
        });

        it('credits transferred balances to receiver', async function () {
          const newBalances = await this.token.balanceOfBatch(new Array(ids.length).fill(this.toWhom), ids);
          for (let i = 0; i < newBalances.length; i++) {
            expect(newBalances[i]).to.be.a.bignumber.equal(values[i]);
          }
        });

        it('emits a TransferBatch log', function () {
          expectEvent(this.transferLogs, 'TransferBatch', {
            operator,
            from,
            to: this.toWhom,
            // ids,
            // values,
          });
        });
      }

      context('when called by the multiTokenHolder', async function () {
        beforeEach(async function () {
          this.toWhom = recipient;
          this.transferLogs = await this.token.safeBatchTransferFrom(
            multiTokenHolder,
            recipient,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x',
            { from: multiTokenHolder },
          );
        });

        batchTransferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          ids: [firstTokenId, secondTokenId],
          values: [firstAmount, secondAmount],
        });
      });

      context('when called by an operator on behalf of the multiTokenHolder', function () {
        context('when operator is not approved by multiTokenHolder', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(proxy, false, { from: multiTokenHolder });
          });

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.safeBatchTransferFrom(
                multiTokenHolder,
                recipient,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                '0x',
                { from: proxy },
              ),
              'ERC1155InsufficientApprovalForAll',
              [proxy, multiTokenHolder],
            );
          });
        });

        context('when operator is approved by multiTokenHolder', function () {
          beforeEach(async function () {
            this.toWhom = recipient;
            await this.token.setApprovalForAll(proxy, true, { from: multiTokenHolder });
            this.transferLogs = await this.token.safeBatchTransferFrom(
              multiTokenHolder,
              recipient,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: proxy },
            );
          });

          batchTransferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it("preserves operator's balances not involved in the transfer", async function () {
            const balance1 = await this.token.balanceOf(proxy, firstTokenId);
            expect(balance1).to.be.a.bignumber.equal('0');
            const balance2 = await this.token.balanceOf(proxy, secondTokenId);
            expect(balance2).to.be.a.bignumber.equal('0');
          });
        });
      });

      context('when sending to a valid receiver', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );
        });

        context('without data', function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.safeBatchTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it('calls onERC1155BatchReceived', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'BatchReceived', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              // ids: [firstTokenId, secondTokenId],
              // values: [firstAmount, secondAmount],
              data: null,
            });
          });
        });

        context('with data', function () {
          const data = '0xf00dd00d';
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.safeBatchTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              data,
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it('calls onERC1155Received', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'BatchReceived', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              // ids: [firstTokenId, secondTokenId],
              // values: [firstAmount, secondAmount],
              data,
            });
          });
        });
      });

      context('to a receiver contract returning unexpected value', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
          );
        });

        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.safeBatchTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: multiTokenHolder },
            ),
            'ERC1155InvalidReceiver',
            [this.receiver.address],
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        it('with empty reason', async function () {
          const receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.Empty,
          );

          await expectRevertCustomError(
            this.token.safeBatchTransferFrom(
              multiTokenHolder,
              receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: multiTokenHolder },
            ),
            'ERC1155InvalidReceiver',
            [receiver.address],
          );
        });

        it('with reason string', async function () {
          const receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.String,
          );

          await expectRevert(
            this.token.safeBatchTransferFrom(
              multiTokenHolder,
              receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: multiTokenHolder },
            ),
            'ERC1155ReceiverMock: reverting on batch receive',
          );
        });

        it('with custom error', async function () {
          const receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.None,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.Custom,
          );

          await expectRevertCustomError(
            this.token.safeBatchTransferFrom(
              multiTokenHolder,
              receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: multiTokenHolder },
            ),
            'ERC1155ReceiverMockError',
            [],
          );
        });
      });

      context('to a receiver contract that reverts only on single transfers', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
            RevertType.String,
            RECEIVER_BATCH_MAGIC_VALUE,
            RevertType.None,
          );

          this.toWhom = this.receiver.address;
          this.transferReceipt = await this.token.safeBatchTransferFrom(
            multiTokenHolder,
            this.receiver.address,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x',
            { from: multiTokenHolder },
          );
          this.transferLogs = this.transferReceipt;
        });

        batchTransferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          ids: [firstTokenId, secondTokenId],
          values: [firstAmount, secondAmount],
        });

        it('calls onERC1155BatchReceived', async function () {
          await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'BatchReceived', {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            // ids: [firstTokenId, secondTokenId],
            // values: [firstAmount, secondAmount],
            data: null,
          });
        });
      });

      context('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const invalidReceiver = this.token;
          await expectRevert.unspecified(
            this.token.safeBatchTransferFrom(
              multiTokenHolder,
              invalidReceiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x',
              { from: multiTokenHolder },
            ),
          );
        });
      });
    });

    shouldSupportInterfaces(['ERC165', 'ERC1155']);
  });
}

module.exports = {
  shouldBehaveLikeERC1155,
};
