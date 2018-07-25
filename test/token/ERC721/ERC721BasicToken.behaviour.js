const { shouldSupportInterfaces } = require('../../introspection/SupportsInterface.behavior');
const { assertRevert } = require('../../helpers/assertRevert');
const { decodeLogs } = require('../../helpers/decodeLogs');
const { sendTransaction } = require('../../helpers/sendTransaction');
const _ = require('lodash');

const ERC721Receiver = artifacts.require('ERC721ReceiverMock.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC721BasicToken (accounts) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const unknownTokenId = 3;
  const creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const RECEIVER_MAGIC_VALUE = '0x150b7a02';

  describe('like an ERC721BasicToken', function () {
    beforeEach(async function () {
      await this.token.mint(creator, firstTokenId, { from: creator });
      await this.token.mint(creator, secondTokenId, { from: creator });
    });

    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          const balance = await this.token.balanceOf(creator);
          balance.should.be.bignumber.equal(2);
        });
      });

      context('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          const balance = await this.token.balanceOf(accounts[1]);
          balance.should.be.bignumber.equal(0);
        });
      });

      context('when querying the zero address', function () {
        it('throws', async function () {
          await assertRevert(this.token.balanceOf(0));
        });
      });
    });

    describe('exists', function () {
      context('when the token exists', function () {
        const tokenId = firstTokenId;

        it('should return true', async function () {
          const result = await this.token.exists(tokenId);
          result.should.be.true;
        });
      });

      context('when the token does not exist', function () {
        const tokenId = unknownTokenId;

        it('should return false', async function () {
          const result = await this.token.exists(tokenId);
          result.should.be.false;
        });
      });
    });

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the owner of the given token ID', async function () {
          const owner = await this.token.ownerOf(tokenId);
          owner.should.be.equal(creator);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = unknownTokenId;

        it('reverts', async function () {
          await assertRevert(this.token.ownerOf(tokenId));
        });
      });
    });

    describe('transfers', function () {
      const owner = accounts[0];
      const approved = accounts[2];
      const operator = accounts[3];
      const unauthorized = accounts[4];
      const tokenId = firstTokenId;
      const data = '0x42';

      let logs = null;

      beforeEach(async function () {
        this.to = accounts[1];
        await this.token.approve(approved, tokenId, { from: owner });
        await this.token.setApprovalForAll(operator, true, { from: owner });
      });

      const transferWasSuccessful = function ({ owner, tokenId, approved }) {
        it('transfers the ownership of the given token ID to the given address', async function () {
          const newOwner = await this.token.ownerOf(tokenId);
          newOwner.should.be.equal(this.to);
        });

        it('clears the approval for the token ID', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        if (approved) {
          it('emit only a transfer event', async function () {
            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('Transfer');
            logs[0].args._from.should.be.equal(owner);
            logs[0].args._to.should.be.equal(this.to);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
          });
        } else {
          it('emits only a transfer event', async function () {
            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('Transfer');
            logs[0].args._from.should.be.equal(owner);
            logs[0].args._to.should.be.equal(this.to);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
          });
        }

        it('adjusts owners balances', async function () {
          const newOwnerBalance = await this.token.balanceOf(this.to);
          newOwnerBalance.should.be.bignumber.equal(1);

          const previousOwnerBalance = await this.token.balanceOf(owner);
          previousOwnerBalance.should.be.bignumber.equal(1);
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          const newOwnerToken = await this.token.tokenOfOwnerByIndex(this.to, 0);
          newOwnerToken.toNumber().should.be.equal(tokenId);

          const previousOwnerToken = await this.token.tokenOfOwnerByIndex(owner, 0);
          previousOwnerToken.toNumber().should.not.be.equal(tokenId);
        });
      };

      const shouldTransferTokensByUsers = function (transferFunction) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.to, tokenId, { from: owner }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.to, tokenId, { from: approved }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.to, tokenId, { from: operator }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
            ({ logs } = await transferFunction.call(this, owner, this.to, tokenId, { from: operator }));
          });
          transferWasSuccessful({ owner, tokenId, approved: null });
        });

        context('when sent to the owner', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, owner, tokenId, { from: owner }));
          });

          it('keeps ownership of the token', async function () {
            const newOwner = await this.token.ownerOf(tokenId);
            newOwner.should.be.equal(owner);
          });

          it('clears the approval for the token ID', async function () {
            const approvedAccount = await this.token.getApproved(tokenId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });

          it('emits only a transfer event', async function () {
            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('Transfer');
            logs[0].args._from.should.be.equal(owner);
            logs[0].args._to.should.be.equal(owner);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
          });

          it('keeps the owner balance', async function () {
            const ownerBalance = await this.token.balanceOf(owner);
            ownerBalance.should.be.bignumber.equal(2);
          });

          it('keeps same tokens by index', async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(_.range(2).map(i => this.token.tokenOfOwnerByIndex(owner, i)));
            tokensListed.map(t => t.toNumber()).should.have.members([firstTokenId, secondTokenId]);
          });
        });

        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, unauthorized, this.to, tokenId, { from: owner }));
          });
        });

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, owner, this.to, tokenId, { from: unauthorized }));
          });
        });

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, owner, this.to, unknownTokenId, { from: owner }));
          });
        });

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, owner, ZERO_ADDRESS, tokenId, { from: owner }));
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
          return sendTransaction(
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
              this.receiver = await ERC721Receiver.new(RECEIVER_MAGIC_VALUE, false);
              this.to = this.receiver.address;
            });

            shouldTransferTokensByUsers(transferFun);

            it('should call onERC721Received', async function () {
              const result = await transferFun.call(this, owner, this.to, tokenId, { from: owner });
              result.receipt.logs.length.should.be.equal(2);
              const [log] = decodeLogs([result.receipt.logs[1]], ERC721Receiver, this.receiver.address);
              log.event.should.be.eq('Received');
              log.args._operator.should.be.equal(owner);
              log.args._from.should.be.equal(owner);
              log.args._tokenId.toNumber().should.be.equal(tokenId);
              log.args._data.should.be.equal(data);
            });

            it('should call onERC721Received from approved', async function () {
              const result = await transferFun.call(this, owner, this.to, tokenId, { from: approved });
              result.receipt.logs.length.should.be.equal(2);
              const [log] = decodeLogs([result.receipt.logs[1]], ERC721Receiver, this.receiver.address);
              log.event.should.be.eq('Received');
              log.args._operator.should.be.equal(approved);
              log.args._from.should.be.equal(owner);
              log.args._tokenId.toNumber().should.be.equal(tokenId);
              log.args._data.should.be.equal(data);
            });

            describe('with an invalid token id', function () {
              it('reverts', async function () {
                await assertRevert(
                  transferFun.call(
                    this,
                    owner,
                    this.to,
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
            const invalidReceiver = await ERC721Receiver.new('0x42', false);
            await assertRevert(this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner }));
          });
        });

        describe('to a receiver contract that throws', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721Receiver.new(RECEIVER_MAGIC_VALUE, true);
            await assertRevert(this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner }));
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const invalidReceiver = this.token;
            await assertRevert(this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner }));
          });
        });
      });
    });

    describe('approve', function () {
      const tokenId = firstTokenId;
      const sender = creator;
      const to = accounts[1];

      let logs = null;

      const itClearsApproval = function () {
        it('clears approval for the token', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });
      };

      const itApproves = function (address) {
        it('sets the approval for the target address', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it('emits an approval event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(address);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      };

      context('when clearing approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: sender }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });

        context('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.approve(to, tokenId, { from: sender });
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: sender }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });
      });

      context('when approving a non-zero address', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(to, tokenId, { from: sender }));
          });

          itApproves(to);
          itEmitsApprovalEvent(to);
        });

        context('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.approve(to, tokenId, { from: sender });
            ({ logs } = await this.token.approve(to, tokenId, { from: sender }));
          });

          itApproves(to);
          itEmitsApprovalEvent(to);
        });

        context('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.approve(accounts[2], tokenId, { from: sender });
            ({ logs } = await this.token.approve(to, tokenId, { from: sender }));
          });

          itApproves(to);
          itEmitsApprovalEvent(to);
        });
      });

      context('when the address that receives the approval is the owner', function () {
        it('reverts', async function () {
          await assertRevert(this.token.approve(sender, tokenId, { from: sender }));
        });
      });

      context('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await assertRevert(this.token.approve(to, tokenId, { from: accounts[2] }));
        });
      });

      context('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.approve(accounts[2], tokenId, { from: sender });
          await assertRevert(this.token.approve(to, tokenId, { from: accounts[2] }));
        });
      });

      context('when the sender is an operator', function () {
        const operator = accounts[2];
        beforeEach(async function () {
          await this.token.setApprovalForAll(operator, true, { from: sender });
          ({ logs } = await this.token.approve(to, tokenId, { from: operator }));
        });

        itApproves(to);
        itEmitsApprovalEvent(to);
      });

      context('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await assertRevert(this.token.approve(to, unknownTokenId, { from: sender }));
        });
      });
    });

    describe('setApprovalForAll', function () {
      const sender = creator;

      context('when the operator willing to approve is not the owner', function () {
        const operator = accounts[1];

        context('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.true;
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: sender });

            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('ApprovalForAll');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._operator.should.be.equal(operator);
            logs[0].args._approved.should.be.true;
          });
        });

        context('when the operator was set as not approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, false, { from: sender });
          });

          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.true;
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: sender });

            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('ApprovalForAll');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._operator.should.be.equal(operator);
            logs[0].args._approved.should.be.true;
          });

          it('can unset the operator approval', async function () {
            await this.token.setApprovalForAll(operator, false, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.false;
          });
        });

        context('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });
          });

          it('keeps the approval to the given address', async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.true;
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: sender });

            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('ApprovalForAll');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._operator.should.be.equal(operator);
            logs[0].args._approved.should.be.true;
          });
        });
      });

      context('when the operator is the owner', function () {
        const operator = creator;

        it('reverts', async function () {
          await assertRevert(this.token.setApprovalForAll(operator, true, { from: sender }));
        });
      });
    });

    shouldSupportInterfaces([
      'ERC165',
      'ERC721',
      'ERC721Exists',
    ]);
  });
}

module.exports = {
  shouldBehaveLikeERC721BasicToken,
};
