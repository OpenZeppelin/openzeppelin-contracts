const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');
const { expectRevertCustomError } = require('../../../helpers/customError');
const { Enum } = require('../../../helpers/enums');

const ERC1363Receiver = artifacts.require('ERC1363ReceiverMock');
const ERC1363Spender = artifacts.require('ERC1363SpenderMock');

const RevertType = Enum('None', 'RevertWithoutMessage', 'RevertWithMessage', 'RevertWithCustomError', 'Panic');

function shouldBehaveLikeERC1363(initialSupply, accounts) {
  const [owner, spender, recipient] = accounts;

  const RECEIVER_MAGIC_VALUE = '0x88a7ca5c';
  const SPENDER_MAGIC_VALUE = '0x7b04a2d0';

  shouldSupportInterfaces(['ERC165', 'ERC1363']);

  describe('transfers', function () {
    const initialBalance = initialSupply;
    const data = '0x42';

    describe('via transferAndCall', function () {
      const transferAndCallWithData = function (to, value, opts) {
        return this.token.methods['transferAndCall(address,uint256,bytes)'](to, value, data, opts);
      };

      const transferAndCallWithoutData = function (to, value, opts) {
        return this.token.methods['transferAndCall(address,uint256)'](to, value, opts);
      };

      const shouldTransferSafely = function (transferFunction, data) {
        describe('to a valid receiver contract', function () {
          beforeEach(async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.None);
            this.to = this.receiver.address;
          });

          it('calls onTransferReceived', async function () {
            const receipt = await transferFunction.call(this, this.to, initialBalance, { from: owner });

            await expectEvent.inTransaction(receipt.tx, ERC1363Receiver, 'Received', {
              operator: owner,
              from: owner,
              value: initialBalance,
              data,
            });
          });
        });
      };

      const transferWasSuccessful = function (from, balance) {
        let to;

        beforeEach(async function () {
          const receiverContract = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.None);
          to = receiverContract.address;
        });

        describe('when the sender does not have enough balance', function () {
          const value = balance + 1;

          describe('with data', function () {
            it('reverts', async function () {
              await expectRevertCustomError(
                transferAndCallWithData.call(this, to, value, { from }),
                'ERC20InsufficientBalance',
                [from, balance, value],
              );
            });
          });

          describe('without data', function () {
            it('reverts', async function () {
              await expectRevertCustomError(
                transferAndCallWithoutData.call(this, to, value, { from }),
                'ERC20InsufficientBalance',
                [from, balance, value],
              );
            });
          });
        });

        describe('when the sender has enough balance', function () {
          const value = balance;

          describe('with data', function () {
            it('transfers the requested amount', async function () {
              await transferAndCallWithData.call(this, to, value, { from });

              expect(await this.token.balanceOf(from)).to.be.bignumber.equal('0');

              expect(await this.token.balanceOf(to)).to.be.bignumber.equal(value);
            });

            it('emits a transfer event', async function () {
              expectEvent(await transferAndCallWithData.call(this, to, value, { from }), 'Transfer', {
                from,
                to,
                value,
              });
            });
          });

          describe('without data', function () {
            it('transfers the requested amount', async function () {
              await transferAndCallWithoutData.call(this, to, value, { from });

              expect(await this.token.balanceOf(from)).to.be.bignumber.equal('0');

              expect(await this.token.balanceOf(to)).to.be.bignumber.equal(value);
            });

            it('emits a transfer event', async function () {
              expectEvent(await transferAndCallWithoutData.call(this, to, value, { from }), 'Transfer', {
                from,
                to,
                value,
              });
            });
          });
        });
      };

      describe('with data', function () {
        shouldTransferSafely(transferAndCallWithData, data);
      });

      describe('without data', function () {
        shouldTransferSafely(transferAndCallWithoutData, null);
      });

      describe('testing ERC20 behavior', function () {
        transferWasSuccessful(owner, initialBalance);
      });

      describe('to a receiver that is not a contract', function () {
        it('reverts', async function () {
          await expectRevertCustomError(
            transferAndCallWithoutData.call(this, recipient, initialBalance, { from: owner }),
            'ERC1363EOAReceiver',
            [recipient],
          );
        });
      });

      describe('to a receiver contract returning unexpected value', function () {
        it('reverts', async function () {
          const invalidReceiver = await ERC1363Receiver.new(data, RevertType.None);
          await expectRevertCustomError(
            transferAndCallWithoutData.call(this, invalidReceiver.address, initialBalance, { from: owner }),
            'ERC1363InvalidReceiver',
            [invalidReceiver.address],
          );
        });
      });

      describe('to a receiver contract that reverts with message', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithMessage);
          await expectRevert(
            transferAndCallWithoutData.call(this, revertingReceiver.address, initialBalance, { from: owner }),
            'ERC1363ReceiverMock: reverting',
          );
        });
      });

      describe('to a receiver contract that reverts without message', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithoutMessage);
          await expectRevertCustomError(
            transferAndCallWithoutData.call(this, revertingReceiver.address, initialBalance, { from: owner }),
            'ERC1363InvalidReceiver',
            [revertingReceiver.address],
          );
        });
      });

      describe('to a receiver contract that reverts with custom error', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithCustomError);
          await expectRevertCustomError(
            transferAndCallWithoutData.call(this, revertingReceiver.address, initialBalance, { from: owner }),
            'CustomError',
            [RECEIVER_MAGIC_VALUE],
          );
        });
      });

      describe('to a receiver contract that panics', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.Panic);
          await expectRevert.unspecified(
            transferAndCallWithoutData.call(this, revertingReceiver.address, initialBalance, { from: owner }),
          );
        });
      });

      describe('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const nonReceiver = this.token;
          await expectRevertCustomError(
            transferAndCallWithoutData.call(this, nonReceiver.address, initialBalance, { from: owner }),
            'ERC1363InvalidReceiver',
            [nonReceiver.address],
          );
        });
      });
    });

    describe('via transferFromAndCall', function () {
      beforeEach(async function () {
        await this.token.approve(spender, initialBalance, { from: owner });
      });

      const transferFromAndCallWithData = function (from, to, value, opts) {
        return this.token.methods['transferFromAndCall(address,address,uint256,bytes)'](from, to, value, data, opts);
      };

      const transferFromAndCallWithoutData = function (from, to, value, opts) {
        return this.token.methods['transferFromAndCall(address,address,uint256)'](from, to, value, opts);
      };

      const shouldTransferFromSafely = function (transferFunction, data) {
        describe('to a valid receiver contract', function () {
          beforeEach(async function () {
            this.receiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.None);
            this.to = this.receiver.address;
          });

          it('calls onTransferReceived', async function () {
            const receipt = await transferFunction.call(this, owner, this.to, initialBalance, { from: spender });

            await expectEvent.inTransaction(receipt.tx, ERC1363Receiver, 'Received', {
              operator: spender,
              from: owner,
              value: initialBalance,
              data,
            });
          });
        });
      };

      const transferFromWasSuccessful = function (from, spender, balance) {
        let to;

        beforeEach(async function () {
          const receiverContract = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.None);
          to = receiverContract.address;
        });

        describe('when the sender does not have enough balance', function () {
          const value = balance + 1;

          describe('with data', function () {
            it('reverts', async function () {
              await expectRevertCustomError(
                transferFromAndCallWithData.call(this, from, to, value, { from: spender }),
                'ERC20InsufficientAllowance',
                [spender, balance, value],
              );
            });
          });

          describe('without data', function () {
            it('reverts', async function () {
              await expectRevertCustomError(
                transferFromAndCallWithoutData.call(this, from, to, value, { from: spender }),
                'ERC20InsufficientAllowance',
                [spender, balance, value],
              );
            });
          });
        });

        describe('when the sender has enough balance', function () {
          const value = balance;

          describe('with data', function () {
            it('transfers the requested amount', async function () {
              await transferFromAndCallWithData.call(this, from, to, value, { from: spender });

              expect(await this.token.balanceOf(from)).to.be.bignumber.equal('');

              expect(await this.token.balanceOf(to)).to.be.bignumber.equal(value);
            });

            it('emits a transfer event', async function () {
              expectEvent(
                await transferFromAndCallWithData.call(this, from, to, value, { from: spender }),
                'Transfer',
                { from, to, value },
              );
            });
          });

          describe('without data', function () {
            it('transfers the requested amount', async function () {
              await transferFromAndCallWithoutData.call(this, from, to, value, { from: spender });

              expect(await this.token.balanceOf(from)).to.be.bignumber.equal('0');

              expect(await this.token.balanceOf(to)).to.be.bignumber.equal(value);
            });

            it('emits a transfer event', async function () {
              expectEvent(
                await transferFromAndCallWithoutData.call(this, from, to, value, { from: spender }),
                'Transfer',
                { from, to, value },
              );
            });
          });
        });
      };

      describe('with data', function () {
        shouldTransferFromSafely(transferFromAndCallWithData, data);
      });

      describe('without data', function () {
        shouldTransferFromSafely(transferFromAndCallWithoutData, null);
      });

      describe('testing ERC20 behavior', function () {
        transferFromWasSuccessful(owner, spender, initialBalance);
      });

      describe('to a receiver that is not a contract', function () {
        it('reverts', async function () {
          await expectRevertCustomError(
            transferFromAndCallWithoutData.call(this, owner, recipient, initialBalance, { from: spender }),
            'ERC1363EOAReceiver',
            [recipient],
          );
        });
      });

      describe('to a receiver contract returning unexpected value', function () {
        it('reverts', async function () {
          const invalidReceiver = await ERC1363Receiver.new(data, RevertType.None);
          await expectRevertCustomError(
            transferFromAndCallWithoutData.call(this, owner, invalidReceiver.address, initialBalance, {
              from: spender,
            }),
            'ERC1363InvalidReceiver',
            [invalidReceiver.address],
          );
        });
      });

      describe('to a receiver contract that reverts with message', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithMessage);
          await expectRevert(
            transferFromAndCallWithoutData.call(this, owner, revertingReceiver.address, initialBalance, {
              from: spender,
            }),
            'ERC1363ReceiverMock: reverting',
          );
        });
      });

      describe('to a receiver contract that reverts without message', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithoutMessage);
          await expectRevertCustomError(
            transferFromAndCallWithoutData.call(this, owner, revertingReceiver.address, initialBalance, {
              from: spender,
            }),
            'ERC1363InvalidReceiver',
            [revertingReceiver.address],
          );
        });
      });

      describe('to a receiver contract that reverts with custom error', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithCustomError);
          await expectRevertCustomError(
            transferFromAndCallWithoutData.call(this, owner, revertingReceiver.address, initialBalance, {
              from: spender,
            }),
            'CustomError',
            [RECEIVER_MAGIC_VALUE],
          );
        });
      });

      describe('to a receiver contract that panics', function () {
        it('reverts', async function () {
          const revertingReceiver = await ERC1363Receiver.new(RECEIVER_MAGIC_VALUE, RevertType.Panic);
          await expectRevert.unspecified(
            transferFromAndCallWithoutData.call(this, owner, revertingReceiver.address, initialBalance, {
              from: spender,
            }),
          );
        });
      });

      describe('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const nonReceiver = this.token;
          await expectRevertCustomError(
            transferFromAndCallWithoutData.call(this, owner, nonReceiver.address, initialBalance, { from: spender }),
            'ERC1363InvalidReceiver',
            [nonReceiver.address],
          );
        });
      });
    });
  });

  describe('approvals', function () {
    const initialBalance = initialSupply;
    const data = '0x42';

    describe('via approveAndCall', function () {
      const approveAndCallWithData = function (spender, value, opts) {
        return this.token.methods['approveAndCall(address,uint256,bytes)'](spender, value, data, opts);
      };

      const approveAndCallWithoutData = function (spender, value, opts) {
        return this.token.methods['approveAndCall(address,uint256)'](spender, value, opts);
      };

      const shouldApproveSafely = function (approveFunction, data) {
        describe('to a valid receiver contract', function () {
          beforeEach(async function () {
            this.spender = await ERC1363Spender.new(SPENDER_MAGIC_VALUE, RevertType.None);
            this.to = this.spender.address;
          });

          it('calls onApprovalReceived', async function () {
            const receipt = await approveFunction.call(this, this.to, initialBalance, { from: owner });

            await expectEvent.inTransaction(receipt.tx, ERC1363Spender, 'Approved', {
              owner,
              value: initialBalance,
              data,
            });
          });
        });
      };

      const approveWasSuccessful = function (owner, balance) {
        const value = balance;

        let spender;

        beforeEach(async function () {
          const spenderContract = await ERC1363Spender.new(SPENDER_MAGIC_VALUE, RevertType.None);
          spender = spenderContract.address;
        });

        describe('with data', function () {
          it('approves the requested amount', async function () {
            await approveAndCallWithData.call(this, spender, value, { from: owner });

            expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
          });

          it('emits an approval event', async function () {
            expectEvent(await approveAndCallWithData.call(this, spender, value, { from: owner }), 'Approval', {
              owner,
              spender,
              value,
            });
          });
        });

        describe('without data', function () {
          it('approves the requested amount', async function () {
            await approveAndCallWithoutData.call(this, spender, value, { from: owner });

            expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
          });

          it('emits an approval event', async function () {
            expectEvent(await approveAndCallWithoutData.call(this, spender, value, { from: owner }), 'Approval', {
              owner,
              spender,
              value,
            });
          });
        });
      };

      describe('with data', function () {
        shouldApproveSafely(approveAndCallWithData, data);
      });

      describe('without data', function () {
        shouldApproveSafely(approveAndCallWithoutData, null);
      });

      describe('testing ERC20 behavior', function () {
        approveWasSuccessful(owner, initialBalance);
      });

      describe('to a spender that is not a contract', function () {
        it('reverts', async function () {
          await expectRevertCustomError(
            approveAndCallWithoutData.call(this, recipient, initialBalance, { from: owner }),
            'ERC1363EOASpender',
            [recipient],
          );
        });
      });

      describe('to a spender contract returning unexpected value', function () {
        it('reverts', async function () {
          const invalidSpender = await ERC1363Spender.new(data, RevertType.None);
          await expectRevertCustomError(
            approveAndCallWithoutData.call(this, invalidSpender.address, initialBalance, { from: owner }),
            'ERC1363InvalidSpender',
            [invalidSpender.address],
          );
        });
      });

      describe('to a spender contract that reverts with message', function () {
        it('reverts', async function () {
          const revertingSpender = await ERC1363Spender.new(SPENDER_MAGIC_VALUE, RevertType.RevertWithMessage);
          await expectRevert(
            approveAndCallWithoutData.call(this, revertingSpender.address, initialBalance, { from: owner }),
            'ERC1363SpenderMock: reverting',
          );
        });
      });

      describe('to a spender contract that reverts without message', function () {
        it('reverts', async function () {
          const revertingSpender = await ERC1363Spender.new(SPENDER_MAGIC_VALUE, RevertType.RevertWithoutMessage);
          await expectRevertCustomError(
            approveAndCallWithoutData.call(this, revertingSpender.address, initialBalance, { from: owner }),
            'ERC1363InvalidSpender',
            [revertingSpender.address],
          );
        });
      });

      describe('to a spender contract that reverts with custom error', function () {
        it('reverts', async function () {
          const revertingSpender = await ERC1363Spender.new(SPENDER_MAGIC_VALUE, RevertType.RevertWithCustomError);
          await expectRevertCustomError(
            approveAndCallWithoutData.call(this, revertingSpender.address, initialBalance, { from: owner }),
            'CustomError',
            [SPENDER_MAGIC_VALUE],
          );
        });
      });

      describe('to a spender contract that panics', function () {
        it('reverts', async function () {
          const revertingSpender = await ERC1363Spender.new(SPENDER_MAGIC_VALUE, RevertType.Panic);
          await expectRevert.unspecified(
            approveAndCallWithoutData.call(this, revertingSpender.address, initialBalance, { from: owner }),
          );
        });
      });

      describe('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const nonSpender = this.token;
          await expectRevertCustomError(
            approveAndCallWithoutData.call(this, nonSpender.address, initialBalance, { from: owner }),
            'ERC1363InvalidSpender',
            [nonSpender.address],
          );
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC1363,
};
