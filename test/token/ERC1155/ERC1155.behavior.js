const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');
const { expectRevertCustomError } = require('../../helpers/customError');
const { Enum } = require('../../helpers/enums');

const ERC1155ReceiverMock = artifacts.require('ERC1155ReceiverMock');
const RevertType = Enum('None', 'RevertWithoutMessage', 'RevertWithMessage', 'RevertWithCustomError', 'Panic');

function shouldBehaveLikeERC1155([minter, firstTokenHolder, secondTokenHolder, multiTokenHolder, recipient, proxy]) {
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const unknownTokenId = new BN(3);

  const firstTokenValue = new BN(1000);
  const secondTokenValue = new BN(2000);

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
          await this.token.$_mint(firstTokenHolder, firstTokenId, firstTokenValue, '0x', {
            from: minter,
          });
          await this.token.$_mint(secondTokenHolder, secondTokenId, secondTokenValue, '0x', {
            from: minter,
          });
        });

        it('returns the amount of tokens owned by the given addresses', async function () {
          expect(await this.token.balanceOf(firstTokenHolder, firstTokenId)).to.be.bignumber.equal(firstTokenValue);

          expect(await this.token.balanceOf(secondTokenHolder, secondTokenId)).to.be.bignumber.equal(secondTokenValue);

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
          await this.token.$_mint(firstTokenHolder, firstTokenId, firstTokenValue, '0x', {
            from: minter,
          });
          await this.token.$_mint(secondTokenHolder, secondTokenId, secondTokenValue, '0x', {
            from: minter,
          });
        });

        it('returns amounts owned by each account in order passed', async function () {
          const result = await this.token.balanceOfBatch(
            [secondTokenHolder, firstTokenHolder, firstTokenHolder],
            [secondTokenId, firstTokenId, unknownTokenId],
          );
          expect(result).to.be.an('array');
          expect(result[0]).to.be.a.bignumber.equal(secondTokenValue);
          expect(result[1]).to.be.a.bignumber.equal(firstTokenValue);
          expect(result[2]).to.be.a.bignumber.equal('0');
        });

        it('returns multiple times the balance of the same address when asked', async function () {
          const result = await this.token.balanceOfBatch(
            [firstTokenHolder, secondTokenHolder, firstTokenHolder],
            [firstTokenId, secondTokenId, firstTokenId],
          );
          expect(result).to.be.an('array');
          expect(result[0]).to.be.a.bignumber.equal(result[2]);
          expect(result[0]).to.be.a.bignumber.equal(firstTokenValue);
          expect(result[1]).to.be.a.bignumber.equal(secondTokenValue);
          expect(result[2]).to.be.a.bignumber.equal(firstTokenValue);
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

      it('reverts if attempting to approve zero address as an operator', async function () {
        await expectRevertCustomError(
          this.token.setApprovalForAll(constants.ZERO_ADDRESS, true, { from: multiTokenHolder }),
          'ERC1155InvalidOperator',
          [constants.ZERO_ADDRESS],
        );
      });
    });

    describe('safeTransferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(multiTokenHolder, firstTokenId, firstTokenValue, '0x', {
          from: minter,
        });
        await this.token.$_mint(multiTokenHolder, secondTokenId, secondTokenValue, '0x', {
          from: minter,
        });
      });

      it('reverts when transferring more than balance', async function () {
        await expectRevertCustomError(
          this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstTokenValue.addn(1), '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InsufficientBalance',
          [multiTokenHolder, firstTokenValue, firstTokenValue.addn(1), firstTokenId],
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevertCustomError(
          this.token.safeTransferFrom(multiTokenHolder, ZERO_ADDRESS, firstTokenId, firstTokenValue, '0x', {
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
            firstTokenValue,
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
          value: firstTokenValue,
        });

        it('preserves existing balances which are not transferred by multiTokenHolder', async function () {
          const balance1 = await this.token.balanceOf(multiTokenHolder, secondTokenId);
          expect(balance1).to.be.a.bignumber.equal(secondTokenValue);

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
              this.token.safeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstTokenValue, '0x', {
                from: proxy,
              }),
              'ERC1155MissingApprovalForAll',
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
              firstTokenValue,
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
            value: firstTokenValue,
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
              firstTokenValue,
              '0x',
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstTokenValue,
          });

          it('calls onERC1155Received', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'Received', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstTokenValue,
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
              firstTokenValue,
              data,
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstTokenValue,
          });

          it('calls onERC1155Received', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'Received', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstTokenValue,
              data,
            });
          });
        });
      });

      context('to a receiver contract returning unexpected value', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new('0x00c0ffee', RECEIVER_BATCH_MAGIC_VALUE, RevertType.None);
        });

        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.safeTransferFrom(multiTokenHolder, this.receiver.address, firstTokenId, firstTokenValue, '0x', {
              from: multiTokenHolder,
            }),
            'ERC1155InvalidReceiver',
            [this.receiver.address],
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        context('with a revert string', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithMessage,
            );
          });

          it('reverts', async function () {
            await expectRevert(
              this.token.safeTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                firstTokenId,
                firstTokenValue,
                '0x',
                {
                  from: multiTokenHolder,
                },
              ),
              'ERC1155ReceiverMock: reverting on receive',
            );
          });
        });

        context('without a revert string', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            );
          });

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.safeTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                firstTokenId,
                firstTokenValue,
                '0x',
                {
                  from: multiTokenHolder,
                },
              ),
              'ERC1155InvalidReceiver',
              [this.receiver.address],
            );
          });
        });

        context('with a custom error', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            );
          });

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.safeTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                firstTokenId,
                firstTokenValue,
                '0x',
                {
                  from: multiTokenHolder,
                },
              ),
              'CustomError',
              [RECEIVER_SINGLE_MAGIC_VALUE],
            );
          });
        });

        context('with a panic', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.Panic,
            );
          });

          it('reverts', async function () {
            await expectRevert.unspecified(
              this.token.safeTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                firstTokenId,
                firstTokenValue,
                '0x',
                {
                  from: multiTokenHolder,
                },
              ),
            );
          });
        });
      });

      context('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const invalidReceiver = this.token;
          await expectRevert.unspecified(
            this.token.safeTransferFrom(
              multiTokenHolder,
              invalidReceiver.address,
              firstTokenId,
              firstTokenValue,
              '0x',
              {
                from: multiTokenHolder,
              },
            ),
          );
        });
      });
    });

    describe('safeBatchTransferFrom', function () {
      beforeEach(async function () {
        await this.token.$_mint(multiTokenHolder, firstTokenId, firstTokenValue, '0x', {
          from: minter,
        });
        await this.token.$_mint(multiTokenHolder, secondTokenId, secondTokenValue, '0x', {
          from: minter,
        });
      });

      it('reverts when transferring value more than any of balances', async function () {
        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(
            multiTokenHolder,
            recipient,
            [firstTokenId, secondTokenId],
            [firstTokenValue, secondTokenValue.addn(1)],
            '0x',
            { from: multiTokenHolder },
          ),
          'ERC1155InsufficientBalance',
          [multiTokenHolder, secondTokenValue, secondTokenValue.addn(1), secondTokenId],
        );
      });

      it("reverts when ids array length doesn't match values array length", async function () {
        const ids1 = [firstTokenId];
        const tokenValues1 = [firstTokenValue, secondTokenValue];

        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(multiTokenHolder, recipient, ids1, tokenValues1, '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InvalidArrayLength',
          [ids1.length, tokenValues1.length],
        );

        const ids2 = [firstTokenId, secondTokenId];
        const tokenValues2 = [firstTokenValue];
        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(multiTokenHolder, recipient, ids2, tokenValues2, '0x', {
            from: multiTokenHolder,
          }),
          'ERC1155InvalidArrayLength',
          [ids2.length, tokenValues2.length],
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevertCustomError(
          this.token.safeBatchTransferFrom(
            multiTokenHolder,
            ZERO_ADDRESS,
            [firstTokenId, secondTokenId],
            [firstTokenValue, secondTokenValue],
            '0x',
            { from: multiTokenHolder },
          ),
          'ERC1155InvalidReceiver',
          [ZERO_ADDRESS],
        );
      });

      it('reverts when transferring from zero address', async function () {
        await expectRevertCustomError(
          this.token.$_safeBatchTransferFrom(ZERO_ADDRESS, multiTokenHolder, [firstTokenId], [firstTokenValue], '0x'),
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
            [firstTokenValue, secondTokenValue],
            '0x',
            { from: multiTokenHolder },
          );
        });

        batchTransferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          ids: [firstTokenId, secondTokenId],
          values: [firstTokenValue, secondTokenValue],
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
                [firstTokenValue, secondTokenValue],
                '0x',
                { from: proxy },
              ),
              'ERC1155MissingApprovalForAll',
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
              [firstTokenValue, secondTokenValue],
              '0x',
              { from: proxy },
            );
          });

          batchTransferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstTokenValue, secondTokenValue],
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
              [firstTokenValue, secondTokenValue],
              '0x',
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstTokenValue, secondTokenValue],
          });

          it('calls onERC1155BatchReceived', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'BatchReceived', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              // ids: [firstTokenId, secondTokenId],
              // values: [firstTokenValue, secondTokenValue],
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
              [firstTokenValue, secondTokenValue],
              data,
              { from: multiTokenHolder },
            );
            this.transferLogs = this.transferReceipt;
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstTokenValue, secondTokenValue],
          });

          it('calls onERC1155Received', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC1155ReceiverMock, 'BatchReceived', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              // ids: [firstTokenId, secondTokenId],
              // values: [firstTokenValue, secondTokenValue],
              data,
            });
          });
        });
      });

      context('to a receiver contract returning unexpected value', function () {
        beforeEach(async function () {
          this.receiver = await ERC1155ReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE,
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
              [firstTokenValue, secondTokenValue],
              '0x',
              { from: multiTokenHolder },
            ),
            'ERC1155InvalidReceiver',
            [this.receiver.address],
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        context('with a revert string', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithMessage,
            );
          });

          it('reverts', async function () {
            await expectRevert(
              this.token.safeBatchTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstTokenValue, secondTokenValue],
                '0x',
                { from: multiTokenHolder },
              ),
              'ERC1155ReceiverMock: reverting on batch receive',
            );
          });
        });

        context('without a revert string', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            );
          });

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.safeBatchTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstTokenValue, secondTokenValue],
                '0x',
                { from: multiTokenHolder },
              ),
              'ERC1155InvalidReceiver',
              [this.receiver.address],
            );
          });
        });

        context('with a custom error', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            );
          });

          it('reverts', async function () {
            await expectRevertCustomError(
              this.token.safeBatchTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstTokenValue, secondTokenValue],
                '0x',
                { from: multiTokenHolder },
              ),
              'CustomError',
              [RECEIVER_SINGLE_MAGIC_VALUE],
            );
          });
        });

        context('with a panic', function () {
          beforeEach(async function () {
            this.receiver = await ERC1155ReceiverMock.new(
              RECEIVER_SINGLE_MAGIC_VALUE,
              RECEIVER_BATCH_MAGIC_VALUE,
              RevertType.Panic,
            );
          });

          it('reverts', async function () {
            await expectRevert.unspecified(
              this.token.safeBatchTransferFrom(
                multiTokenHolder,
                this.receiver.address,
                [firstTokenId, secondTokenId],
                [firstTokenValue, secondTokenValue],
                '0x',
                { from: multiTokenHolder },
              ),
            );
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
              [firstTokenValue, secondTokenValue],
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
