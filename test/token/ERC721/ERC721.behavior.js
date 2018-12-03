const expectEvent = require('../../helpers/expectEvent');
const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');
const shouldFail = require('../../helpers/shouldFail');
const { ZERO_ADDRESS } = require('../../helpers/constants');
const send = require('../../helpers/send');

const ERC721ReceiverMock = artifacts.require('ERC721ReceiverMock.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC721 (
  creator,
  minter,
  [owner, approved, anotherApproved, operator, anyone]
) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const unknownTokenId = 3;
  const RECEIVER_MAGIC_VALUE = '0x150b7a02';

  describe('like an ERC721', function () {
    beforeEach(async function () {
      await this.token.mint(owner, firstTokenId, { from: minter });
      await this.token.mint(owner, secondTokenId, { from: minter });
      this.toWhom = anyone; // default to anyone for toWhom in context-dependent tests
    });

    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          (await this.token.balanceOf(owner)).should.be.bignumber.equal(2);
        });
      });

      context('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          (await this.token.balanceOf(anyone)).should.be.bignumber.equal(0);
        });
      });

      context('when querying the zero address', function () {
        it('throws', async function () {
          await shouldFail.reverting(this.token.balanceOf(0));
        });
      });
    });

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the owner of the given token ID', async function () {
          (await this.token.ownerOf(tokenId)).should.be.equal(owner);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = unknownTokenId;

        it('reverts', async function () {
          await shouldFail.reverting(this.token.ownerOf(tokenId));
        });
      });
    });

    describe('transfers', function () {
      const tokenId = firstTokenId;
      const data = '0x42';

      let logs = null;

      beforeEach(async function () {
        await this.token.approve(approved, tokenId, { from: owner });
        await this.token.setApprovalForAll(operator, true, { from: owner });
      });

      const transferWasSuccessful = function ({ owner, tokenId, approved }) {
        it('transfers the ownership of the given token ID to the given address', async function () {
          (await this.token.ownerOf(tokenId)).should.be.equal(this.toWhom);
        });

        it('clears the approval for the token ID', async function () {
          (await this.token.getApproved(tokenId)).should.be.equal(ZERO_ADDRESS);
        });

        if (approved) {
          it('emit only a transfer event', async function () {
            expectEvent.inLogs(logs, 'Transfer', {
              from: owner,
              to: this.toWhom,
              tokenId: tokenId,
            });
          });
        } else {
          it('emits only a transfer event', async function () {
            expectEvent.inLogs(logs, 'Transfer', {
              from: owner,
              to: this.toWhom,
              tokenId: tokenId,
            });
          });
        }

        it('adjusts owners balances', async function () {
          (await this.token.balanceOf(owner)).should.be.bignumber.equal(1);
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          (await this.token.tokenOfOwnerByIndex(this.toWhom, 0)).toNumber().should.be.equal(tokenId);

          (await this.token.tokenOfOwnerByIndex(owner, 0)).toNumber().should.not.be.equal(tokenId);
        });
      };

      const shouldTransferTokensByUsers = function (transferFunction) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
            ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
          });
          transferWasSuccessful({ owner, tokenId, approved: null });
        });

        context('when sent to the owner', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, owner, tokenId, { from: owner }));
          });

          it('keeps ownership of the token', async function () {
            (await this.token.ownerOf(tokenId)).should.be.equal(owner);
          });

          it('clears the approval for the token ID', async function () {
            (await this.token.getApproved(tokenId)).should.be.equal(ZERO_ADDRESS);
          });

          it('emits only a transfer event', async function () {
            expectEvent.inLogs(logs, 'Transfer', {
              from: owner,
              to: owner,
              tokenId: tokenId,
            });
          });

          it('keeps the owner balance', async function () {
            (await this.token.balanceOf(owner)).should.be.bignumber.equal(2);
          });

          it('keeps same tokens by index', async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(
              [0, 1].map(i => this.token.tokenOfOwnerByIndex(owner, i))
            );
            tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId, secondTokenId]);
          });
        });

        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await shouldFail.reverting(transferFunction.call(this, anyone, anyone, tokenId, { from: owner })
            );
          });
        });

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await shouldFail.reverting(transferFunction.call(this, owner, anyone, tokenId, { from: anyone })
            );
          });
        });

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await shouldFail.reverting(transferFunction.call(this, owner, anyone, unknownTokenId, { from: owner })
            );
          });
        });

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await shouldFail.reverting(transferFunction.call(this, owner, ZERO_ADDRESS, tokenId, { from: owner }));
          });
        });
      };

      describe('via transferFrom', function () {
        shouldTransferTokensByUsers(function (from, to, tokenId, opts) {
          return this.token.transferFrom(from, to, tokenId, opts);
        });
      });

      describe('via safeTransferFrom', function () {
        const safeTransferFromWithData = function (from, to, tokenId, opts) {
          return send.transaction(
            this.token,
            'safeTransferFrom',
            'address,address,uint256,bytes',
            [from, to, tokenId, data],
            opts
          );
        };

        const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
          return this.token.safeTransferFrom(from, to, tokenId, opts);
        };

        const shouldTransferSafely = function (transferFun, data) {
          describe('to a user account', function () {
            shouldTransferTokensByUsers(transferFun);
          });

          describe('to a valid receiver contract', function () {
            beforeEach(async function () {
              this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, false);
              this.toWhom = this.receiver.address;
            });

            shouldTransferTokensByUsers(transferFun);

            it('should call onERC721Received', async function () {
              const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: owner });

              await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
                operator: owner,
                from: owner,
                tokenId: tokenId,
                data: data,
              });
            });

            it('should call onERC721Received from approved', async function () {
              const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: approved });

              await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
                operator: approved,
                from: owner,
                tokenId: tokenId,
                data: data,
              });
            });

            describe('with an invalid token id', function () {
              it('reverts', async function () {
                await shouldFail.reverting(
                  transferFun.call(
                    this,
                    owner,
                    this.receiver.address,
                    unknownTokenId,
                    { from: owner },
                  )
                );
              });
            });
          });
        };

        describe('with data', function () {
          shouldTransferSafely(safeTransferFromWithData, data);
        });

        describe('without data', function () {
          shouldTransferSafely(safeTransferFromWithoutData, '0x');
        });

        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', false);
            await shouldFail.reverting(
              this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner })
            );
          });
        });

        describe('to a receiver contract that throws', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, true);
            await shouldFail.reverting(
              this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner })
            );
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const invalidReceiver = this.token;
            await shouldFail.reverting(
              this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner })
            );
          });
        });
      });
    });

    describe('approve', function () {
      const tokenId = firstTokenId;

      let logs = null;

      const itClearsApproval = function () {
        it('clears approval for the token', async function () {
          (await this.token.getApproved(tokenId)).should.be.equal(ZERO_ADDRESS);
        });
      };

      const itApproves = function (address) {
        it('sets the approval for the target address', async function () {
          (await this.token.getApproved(tokenId)).should.be.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it('emits an approval event', async function () {
          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            approved: address,
            tokenId: tokenId,
          });
        });
      };

      context('when clearing approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });

        context('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.approve(approved, tokenId, { from: owner });
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });
      });

      context('when approving a non-zero address', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(approved, tokenId, { from: owner }));
          });

          itApproves(approved);
          itEmitsApprovalEvent(approved);
        });

        context('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.approve(approved, tokenId, { from: owner });
            ({ logs } = await this.token.approve(approved, tokenId, { from: owner }));
          });

          itApproves(approved);
          itEmitsApprovalEvent(approved);
        });

        context('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.approve(anotherApproved, tokenId, { from: owner });
            ({ logs } = await this.token.approve(anotherApproved, tokenId, { from: owner }));
          });

          itApproves(anotherApproved);
          itEmitsApprovalEvent(anotherApproved);
        });
      });

      context('when the address that receives the approval is the owner', function () {
        it('reverts', async function () {
          await shouldFail.reverting(
            this.token.approve(owner, tokenId, { from: owner })
          );
        });
      });

      context('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await shouldFail.reverting(this.token.approve(approved, tokenId, { from: anyone }));
        });
      });

      context('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.approve(approved, tokenId, { from: owner });
          await shouldFail.reverting(this.token.approve(anotherApproved, tokenId, { from: approved }));
        });
      });

      context('when the sender is an operator', function () {
        beforeEach(async function () {
          await this.token.setApprovalForAll(operator, true, { from: owner });
          ({ logs } = await this.token.approve(approved, tokenId, { from: operator }));
        });

        itApproves(approved);
        itEmitsApprovalEvent(approved);
      });

      context('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await shouldFail.reverting(this.token.approve(approved, unknownTokenId, { from: operator }));
        });
      });
    });

    describe('setApprovalForAll', function () {
      context('when the operator willing to approve is not the owner', function () {
        context('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            (await this.token.isApprovedForAll(owner, operator)).should.equal(true);
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent.inLogs(logs, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });
        });

        context('when the operator was set as not approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, false, { from: owner });
          });

          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            (await this.token.isApprovedForAll(owner, operator)).should.equal(true);
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent.inLogs(logs, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });

          it('can unset the operator approval', async function () {
            await this.token.setApprovalForAll(operator, false, { from: owner });

            (await this.token.isApprovedForAll(owner, operator)).should.equal(false);
          });
        });

        context('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });
          });

          it('keeps the approval to the given address', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            (await this.token.isApprovedForAll(owner, operator)).should.equal(true);
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent.inLogs(logs, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });
        });
      });

      context('when the operator is the owner', function () {
        it('reverts', async function () {
          await shouldFail.reverting(this.token.setApprovalForAll(owner, true, { from: owner }));
        });
      });
    });

    shouldSupportInterfaces([
      'ERC165',
      'ERC721',
    ]);
  });
}

module.exports = {
  shouldBehaveLikeERC721,
};
