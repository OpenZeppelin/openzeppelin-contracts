const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

const ERC1155ReceiverMock = artifacts.require('ERC1155ReceiverMock');

function shouldBehaveLikeERC1155 ([minter, firstTokenHolder, secondTokenHolder, multiTokenHolder, recipient, proxy]) {
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const unknownTokenId = new BN(3);

  const firstAmount = new BN(1000);
  const secondAmount = new BN(2000);

  const RECEIVER_SINGLE_MAGIC_VALUE = '0xf23a6e61';
  const RECEIVER_BATCH_MAGIC_VALUE = '0xbc197c81';

  describe('like an ERC1155', function () {
    describe('balanceOf', function () {
      it('reverts when queried about the zero address', async function () {
        await expectRevert(
          this.token.balanceOf(ZERO_ADDRESS, firstTokenId),
          'ERC1155: address zero is not a valid owner',
        );
      });

      context('when accounts don\'t own tokens', function () {
        it('returns zero for given addresses', async function () {
          expect(await this.token.balanceOf(
            firstTokenHolder,
            firstTokenId,
          )).to.be.bignumber.equal('0');

          expect(await this.token.balanceOf(
            secondTokenHolder,
            secondTokenId,
          )).to.be.bignumber.equal('0');

          expect(await this.token.balanceOf(
            firstTokenHolder,
            unknownTokenId,
          )).to.be.bignumber.equal('0');
        });
      });

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.mint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.mint(
            secondTokenHolder,
            secondTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            },
          );
        });

        it('returns the amount of tokens owned by the given addresses', async function () {
          expect(await this.token.balanceOf(
            firstTokenHolder,
            firstTokenId,
          )).to.be.bignumber.equal(firstAmount);

          expect(await this.token.balanceOf(
            secondTokenHolder,
            secondTokenId,
          )).to.be.bignumber.equal(secondAmount);

          expect(await this.token.balanceOf(
            firstTokenHolder,
            unknownTokenId,
          )).to.be.bignumber.equal('0');
        });
      });
    });

    describe('balanceOfBatch', function () {
      it('reverts when input arrays don\'t match up', async function () {
        await expectRevert(
          this.token.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, firstTokenHolder, secondTokenHolder],
            [firstTokenId, secondTokenId, unknownTokenId],
          ),
          'ERC1155: accounts and ids length mismatch',
        );

        await expectRevert(
          this.token.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder],
            [firstTokenId, secondTokenId, unknownTokenId],
          ),
          'ERC1155: accounts and ids length mismatch',
        );
      });

      it('reverts when one of the addresses is the zero address', async function () {
        await expectRevert(
          this.token.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, ZERO_ADDRESS],
            [firstTokenId, secondTokenId, unknownTokenId],
          ),
          'ERC1155: address zero is not a valid owner',
        );
      });

      context('when accounts don\'t own tokens', function () {
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
          await this.token.mint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.mint(
            secondTokenHolder,
            secondTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            },
          );
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
        (receipt = await this.token.setApprovalForAll(proxy, true, { from: multiTokenHolder }));
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
        await expectRevert(
          this.token.setApprovalForAll(multiTokenHolder, true, { from: multiTokenHolder }),
          'ERC1155: setting approval status for self',
        );
      });
    });

    describe('safeTransferFrom', function () {
      beforeEach(async function () {
        await this.token.mint(multiTokenHolder, firstTokenId, firstAmount, '0x', {
          from: minter,
        });
        await this.token.mint(
          multiTokenHolder,
          secondTokenId,
          secondAmount,
          '0x',
          {
            from: minter,
          },
        );
      });

      it('reverts when transferring more than balance', async function () {
        await expectRevert(
          this.token.safeTransferFrom(
            multiTokenHolder,
            recipient,
            firstTokenId,
            firstAmount.addn(1),
            '0x',
            { from: multiTokenHolder },
          ),
          'ERC1155: insufficient balance for transfer',
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevert(
          this.token.safeTransferFrom(
            multiTokenHolder,
            ZERO_ADDRESS,
            firstTokenId,
            firstAmount,
            '0x',
            { from: multiTokenHolder },
          ),
          'ERC1155: transfer to the zero address',
        );
      });

      function transferWasSuccessful ({ operator, from, id, value }) {
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
          (this.transferLogs =
            await this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }));
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
            await expectRevert(
              this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
                from: proxy,
              }),
              'ERC1155: caller is not owner nor approved',
            );
          });
        });

        context('when operator is approved by multiTokenHolder', function () {
          beforeEach(async function () {
            this.toWhom = recipient;
            await this.token.setApprovalForAll(proxy, true, { from: multiTokenHolder });
            (this.transferLogs =
              await this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
                from: proxy,
              }));
          });

          transferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it('preserves operator\'s balances not involved in the transfer', async function () {
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
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_BATCH_MAGIC_VALUE, false,
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
            (this.transferLogs = this.transferReceipt);
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
            (this.transferLogs = this.transferReceipt);
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
            '0x00c0ffee', false,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.safeTransferFrom(multiTokenHolder, this.receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155: ERC1155Receiver rejected tokens',
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, true,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.safeTransferFrom(multiTokenHolder, this.receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155ReceiverMock: reverting on receive',
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
        await this.token.mint(multiTokenHolder, firstTokenId, firstAmount, '0x', {
          from: minter,
        });
        await this.token.mint(
          multiTokenHolder,
          secondTokenId,
          secondAmount,
          '0x',
          {
            from: minter,
          },
        );
      });

      it('reverts when transferring amount more than any of balances', async function () {
        await expectRevert(
          this.token.safeBatchTransferFrom(
            multiTokenHolder, recipient,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount.addn(1)],
            '0x', { from: multiTokenHolder },
          ),
          'ERC1155: insufficient balance for transfer',
        );
      });

      it('reverts when ids array length doesn\'t match amounts array length', async function () {
        await expectRevert(
          this.token.safeBatchTransferFrom(
            multiTokenHolder, recipient,
            [firstTokenId],
            [firstAmount, secondAmount],
            '0x', { from: multiTokenHolder },
          ),
          'ERC1155: ids and amounts length mismatch',
        );

        await expectRevert(
          this.token.safeBatchTransferFrom(
            multiTokenHolder, recipient,
            [firstTokenId, secondTokenId],
            [firstAmount],
            '0x', { from: multiTokenHolder },
          ),
          'ERC1155: ids and amounts length mismatch',
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevert(
          this.token.safeBatchTransferFrom(
            multiTokenHolder, ZERO_ADDRESS,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x', { from: multiTokenHolder },
          ),
          'ERC1155: transfer to the zero address',
        );
      });

      function batchTransferWasSuccessful ({ operator, from, ids, values }) {
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
          (this.transferLogs =
            await this.token.safeBatchTransferFrom(
              multiTokenHolder, recipient,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            ));
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
            await expectRevert(
              this.token.safeBatchTransferFrom(
                multiTokenHolder, recipient,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                '0x', { from: proxy },
              ),
              'ERC1155: transfer caller is not owner nor approved',
            );
          });
        });

        context('when operator is approved by multiTokenHolder', function () {
          beforeEach(async function () {
            this.toWhom = recipient;
            await this.token.setApprovalForAll(proxy, true, { from: multiTokenHolder });
            (this.transferLogs =
              await this.token.safeBatchTransferFrom(
                multiTokenHolder, recipient,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                '0x', { from: proxy },
              ));
          });

          batchTransferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it('preserves operator\'s balances not involved in the transfer', async function () {
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
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });

        context('without data', function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.safeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            );
            (this.transferLogs = this.transferReceipt);
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
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              data, { from: multiTokenHolder },
            );
            (this.transferLogs = this.transferReceipt);
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
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_SINGLE_MAGIC_VALUE, false,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.safeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            ),
            'ERC1155: ERC1155Receiver rejected tokens',
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_BATCH_MAGIC_VALUE, true,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.safeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            ),
            'ERC1155ReceiverMock: reverting on batch receive',
          );
        });
      });

      context('to a receiver contract that reverts only on single transfers', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, true,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );

          this.toWhom = this.receiver.address;
          this.transferReceipt = await this.token.safeBatchTransferFrom(
            multiTokenHolder, this.receiver.address,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x', { from: multiTokenHolder },
          );
          (this.transferLogs = this.transferReceipt);
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
              multiTokenHolder, invalidReceiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
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
