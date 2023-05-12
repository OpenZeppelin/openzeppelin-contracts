const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

const ERC721ReceiverMock = artifacts.require('ERC721ReceiverMock');
const NonERC721ReceiverMock = artifacts.require('CallReceiverMock');

const Error = ['None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic'].reduce(
  (acc, entry, idx) => Object.assign({ [entry]: idx }, acc),
  {},
);

const firstTokenId = new BN('5042');
const secondTokenId = new BN('79217');
const nonExistentTokenId = new BN('13');
const fourthTokenId = new BN(4);
const baseURI = 'https://api.example.com/v1/';

const RECEIVER_MAGIC_VALUE = '0x150b7a02';

function shouldBehaveLikeERC721(errorPrefix, owner, newOwner, approved, anotherApproved, operator, other) {
  shouldSupportInterfaces(['ERC165', 'ERC721']);

  context('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(owner, firstTokenId);
      await this.token.$_mint(owner, secondTokenId);
      this.toWhom = other; // default to other for toWhom in context-dependent tests
    });

    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('2');
        });
      });

      context('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        });
      });

      context('when querying the zero address', function () {
        it('throws', async function () {
          await expectRevert(this.token.balanceOf(ZERO_ADDRESS), 'ERC721: address zero is not a valid owner');
        });
      });
    });

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the owner of the given token ID', async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId;

        it('reverts', async function () {
          await expectRevert(this.token.ownerOf(tokenId), 'ERC721: invalid token ID');
        });
      });
    });

    describe('transfers', function () {
      const tokenId = firstTokenId;
      const data = '0x42';

      let receipt = null;

      beforeEach(async function () {
        await this.token.approve(approved, tokenId, { from: owner });
        await this.token.setApprovalForAll(operator, true, { from: owner });
      });

      const transferWasSuccessful = function ({ owner, tokenId }) {
        it('transfers the ownership of the given token ID to the given address', async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(this.toWhom);
        });

        it('emits a Transfer event', async function () {
          expectEvent(receipt, 'Transfer', { from: owner, to: this.toWhom, tokenId: tokenId });
        });

        it('clears the approval for the token ID', async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
        });

        it('adjusts owners balances', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          expect(await this.token.tokenOfOwnerByIndex(this.toWhom, 0)).to.be.bignumber.equal(tokenId);

          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.not.equal(tokenId);
        });
      };

      const shouldTransferTokensByUsers = function (transferFunction) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            receipt = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner });
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
            receipt = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved });
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
            receipt = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator });
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        context('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
            receipt = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator });
          });
          transferWasSuccessful({ owner, tokenId, approved: null });
        });

        context('when sent to the owner', function () {
          beforeEach(async function () {
            receipt = await transferFunction.call(this, owner, owner, tokenId, { from: owner });
          });

          it('keeps ownership of the token', async function () {
            expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
          });

          it('clears the approval for the token ID', async function () {
            expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });

          it('emits only a transfer event', async function () {
            expectEvent(receipt, 'Transfer', {
              from: owner,
              to: owner,
              tokenId: tokenId,
            });
          });

          it('keeps the owner balance', async function () {
            expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('2');
          });

          it('keeps same tokens by index', async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all([0, 1].map(i => this.token.tokenOfOwnerByIndex(owner, i)));
            expect(tokensListed.map(t => t.toNumber())).to.have.members([
              firstTokenId.toNumber(),
              secondTokenId.toNumber(),
            ]);
          });
        });

        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, other, other, tokenId, { from: owner }),
              'ERC721: transfer from incorrect owner',
            );
          });
        });

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, owner, other, tokenId, { from: other }),
              'ERC721: caller is not token owner or approved',
            );
          });
        });

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, owner, other, nonExistentTokenId, { from: owner }),
              'ERC721: invalid token ID',
            );
          });
        });

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await expectRevert(
              transferFunction.call(this, owner, ZERO_ADDRESS, tokenId, { from: owner }),
              'ERC721: transfer to the zero address',
            );
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
          return this.token.methods['safeTransferFrom(address,address,uint256,bytes)'](from, to, tokenId, data, opts);
        };

        const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
          return this.token.methods['safeTransferFrom(address,address,uint256)'](from, to, tokenId, opts);
        };

        const shouldTransferSafely = function (transferFun, data) {
          describe('to a user account', function () {
            shouldTransferTokensByUsers(transferFun);
          });

          describe('to a valid receiver contract', function () {
            beforeEach(async function () {
              this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
              this.toWhom = this.receiver.address;
            });

            shouldTransferTokensByUsers(transferFun);

            it('calls onERC721Received', async function () {
              const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: owner });

              await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
                operator: owner,
                from: owner,
                tokenId: tokenId,
                data: data,
              });
            });

            it('calls onERC721Received from approved', async function () {
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
                await expectRevert(
                  transferFun.call(this, owner, this.receiver.address, nonExistentTokenId, { from: owner }),
                  'ERC721: invalid token ID',
                );
              });
            });
          });
        };

        describe('with data', function () {
          shouldTransferSafely(safeTransferFromWithData, data);
        });

        describe('without data', function () {
          shouldTransferSafely(safeTransferFromWithoutData, null);
        });

        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', Error.None);
            await expectRevert(
              this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner }),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        describe('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
            await expectRevert(
              this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
              'ERC721ReceiverMock: reverting',
            );
          });
        });

        describe('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
            await expectRevert(
              this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        describe('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.Panic);
            await expectRevert.unspecified(
              this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
            );
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = await NonERC721ReceiverMock.new();
            await expectRevert(
              this.token.safeTransferFrom(owner, nonReceiver.address, tokenId, { from: owner }),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });
      });
    });

    describe('safe mint', function () {
      const tokenId = fourthTokenId;
      const data = '0x42';

      describe('via safeMint', function () {
        // regular minting is tested in ERC721Mintable.test.js and others
        it('calls onERC721Received — with data', async function () {
          this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
          const receipt = await this.token.$_safeMint(this.receiver.address, tokenId, data);

          await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            from: ZERO_ADDRESS,
            tokenId: tokenId,
            data: data,
          });
        });

        it('calls onERC721Received — without data', async function () {
          this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
          const receipt = await this.token.$_safeMint(this.receiver.address, tokenId);

          await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            from: ZERO_ADDRESS,
            tokenId: tokenId,
          });
        });

        context('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', Error.None);
            await expectRevert(
              this.token.$_safeMint(invalidReceiver.address, tokenId),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        context('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
            await expectRevert(
              this.token.$_safeMint(revertingReceiver.address, tokenId),
              'ERC721ReceiverMock: reverting',
            );
          });
        });

        context('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
            await expectRevert(
              this.token.$_safeMint(revertingReceiver.address, tokenId),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

        context('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.Panic);
            await expectRevert.unspecified(this.token.$_safeMint(revertingReceiver.address, tokenId));
          });
        });

        context('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = await NonERC721ReceiverMock.new();
            await expectRevert(
              this.token.$_safeMint(nonReceiver.address, tokenId),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });
      });
    });

    describe('approve', function () {
      const tokenId = firstTokenId;

      let receipt = null;

      const itClearsApproval = function () {
        it('clears approval for the token', async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
        });
      };

      const itApproves = function (address) {
        it('sets the approval for the target address', async function () {
          expect(await this.token.getApproved(tokenId)).to.be.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it('emits an approval event', async function () {
          expectEvent(receipt, 'Approval', {
            owner: owner,
            approved: address,
            tokenId: tokenId,
          });
        });
      };

      context('when clearing approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            receipt = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });

        context('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.approve(approved, tokenId, { from: owner });
            receipt = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });
      });

      context('when approving a non-zero address', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            receipt = await this.token.approve(approved, tokenId, { from: owner });
          });

          itApproves(approved);
          itEmitsApprovalEvent(approved);
        });

        context('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.approve(approved, tokenId, { from: owner });
            receipt = await this.token.approve(approved, tokenId, { from: owner });
          });

          itApproves(approved);
          itEmitsApprovalEvent(approved);
        });

        context('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.approve(anotherApproved, tokenId, { from: owner });
            receipt = await this.token.approve(anotherApproved, tokenId, { from: owner });
          });

          itApproves(anotherApproved);
          itEmitsApprovalEvent(anotherApproved);
        });
      });

      context('when the address that receives the approval is the owner', function () {
        it('reverts', async function () {
          await expectRevert(this.token.approve(owner, tokenId, { from: owner }), 'ERC721: approval to current owner');
        });
      });

      context('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.approve(approved, tokenId, { from: other }),
            'ERC721: approve caller is not token owner or approved',
          );
        });
      });

      context('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.approve(approved, tokenId, { from: owner });
          await expectRevert(
            this.token.approve(anotherApproved, tokenId, { from: approved }),
            'ERC721: approve caller is not token owner or approved for all',
          );
        });
      });

      context('when the sender is an operator', function () {
        beforeEach(async function () {
          await this.token.setApprovalForAll(operator, true, { from: owner });
          receipt = await this.token.approve(approved, tokenId, { from: operator });
        });

        itApproves(approved);
        itEmitsApprovalEvent(approved);
      });

      context('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await expectRevert(
            this.token.approve(approved, nonExistentTokenId, { from: operator }),
            'ERC721: invalid token ID',
          );
        });
      });
    });

    describe('setApprovalForAll', function () {
      context('when the operator willing to approve is not the owner', function () {
        context('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const receipt = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent(receipt, 'ApprovalForAll', {
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

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const receipt = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent(receipt, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });

          it('can unset the operator approval', async function () {
            await this.token.setApprovalForAll(operator, false, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(false);
          });
        });

        context('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });
          });

          it('keeps the approval to the given address', async function () {
            await this.token.setApprovalForAll(operator, true, { from: owner });

            expect(await this.token.isApprovedForAll(owner, operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const receipt = await this.token.setApprovalForAll(operator, true, { from: owner });

            expectEvent(receipt, 'ApprovalForAll', {
              owner: owner,
              operator: operator,
              approved: true,
            });
          });
        });
      });

      context('when the operator is the owner', function () {
        it('reverts', async function () {
          await expectRevert(this.token.setApprovalForAll(owner, true, { from: owner }), 'ERC721: approve to caller');
        });
      });
    });

    describe('getApproved', async function () {
      context('when token is not minted', async function () {
        it('reverts', async function () {
          await expectRevert(this.token.getApproved(nonExistentTokenId), 'ERC721: invalid token ID');
        });
      });

      context('when token has been minted ', async function () {
        it('should return the zero address', async function () {
          expect(await this.token.getApproved(firstTokenId)).to.be.equal(ZERO_ADDRESS);
        });

        context('when account has been approved', async function () {
          beforeEach(async function () {
            await this.token.approve(approved, firstTokenId, { from: owner });
          });

          it('returns approved account', async function () {
            expect(await this.token.getApproved(firstTokenId)).to.be.equal(approved);
          });
        });
      });
    });
  });

  describe('_mint(address, uint256)', function () {
    it('reverts with a null destination address', async function () {
      await expectRevert(this.token.$_mint(ZERO_ADDRESS, firstTokenId), 'ERC721: mint to the zero address');
    });

    context('with minted token', async function () {
      beforeEach(async function () {
        this.receipt = await this.token.$_mint(owner, firstTokenId);
      });

      it('emits a Transfer event', function () {
        expectEvent(this.receipt, 'Transfer', { from: ZERO_ADDRESS, to: owner, tokenId: firstTokenId });
      });

      it('creates the token', async function () {
        expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
        expect(await this.token.ownerOf(firstTokenId)).to.equal(owner);
      });

      it('reverts when adding a token id that already exists', async function () {
        await expectRevert(this.token.$_mint(owner, firstTokenId), 'ERC721: token already minted');
      });
    });
  });

  describe('_burn', function () {
    it('reverts when burning a non-existent token id', async function () {
      await expectRevert(this.token.$_burn(nonExistentTokenId), 'ERC721: invalid token ID');
    });

    context('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.$_mint(owner, firstTokenId);
        await this.token.$_mint(owner, secondTokenId);
      });

      context('with burnt token', function () {
        beforeEach(async function () {
          this.receipt = await this.token.$_burn(firstTokenId);
        });

        it('emits a Transfer event', function () {
          expectEvent(this.receipt, 'Transfer', { from: owner, to: ZERO_ADDRESS, tokenId: firstTokenId });
        });

        it('deletes the token', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('1');
          await expectRevert(this.token.ownerOf(firstTokenId), 'ERC721: invalid token ID');
        });

        it('reverts when burning a token id that has been deleted', async function () {
          await expectRevert(this.token.$_burn(firstTokenId), 'ERC721: invalid token ID');
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Enumerable(errorPrefix, owner, newOwner, approved, anotherApproved, operator, other) {
  shouldSupportInterfaces(['ERC721Enumerable']);

  context('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(owner, firstTokenId);
      await this.token.$_mint(owner, secondTokenId);
      this.toWhom = other; // default to other for toWhom in context-dependent tests
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('2');
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await expectRevert(this.token.tokenOfOwnerByIndex(owner, 2), 'ERC721Enumerable: owner index out of bounds');
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await expectRevert(this.token.tokenOfOwnerByIndex(other, 0), 'ERC721Enumerable: owner index out of bounds');
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.transferFrom(owner, other, firstTokenId, { from: owner });
          await this.token.transferFrom(owner, other, secondTokenId, { from: owner });
        });

        it('returns correct token IDs for target', async function () {
          expect(await this.token.balanceOf(other)).to.be.bignumber.equal('2');
          const tokensListed = await Promise.all([0, 1].map(i => this.token.tokenOfOwnerByIndex(other, i)));
          expect(tokensListed.map(t => t.toNumber())).to.have.members([
            firstTokenId.toNumber(),
            secondTokenId.toNumber(),
          ]);
        });

        it('returns empty collection for original owner', async function () {
          expect(await this.token.balanceOf(owner)).to.be.bignumber.equal('0');
          await expectRevert(this.token.tokenOfOwnerByIndex(owner, 0), 'ERC721Enumerable: owner index out of bounds');
        });
      });
    });

    describe('tokenByIndex', function () {
      it('returns all tokens', async function () {
        const tokensListed = await Promise.all([0, 1].map(i => this.token.tokenByIndex(i)));
        expect(tokensListed.map(t => t.toNumber())).to.have.members([
          firstTokenId.toNumber(),
          secondTokenId.toNumber(),
        ]);
      });

      it('reverts if index is greater than supply', async function () {
        await expectRevert(this.token.tokenByIndex(2), 'ERC721Enumerable: global index out of bounds');
      });

      [firstTokenId, secondTokenId].forEach(function (tokenId) {
        it(`returns all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const newTokenId = new BN(300);
          const anotherNewTokenId = new BN(400);

          await this.token.$_burn(tokenId);
          await this.token.$_mint(newOwner, newTokenId);
          await this.token.$_mint(newOwner, anotherNewTokenId);

          expect(await this.token.totalSupply()).to.be.bignumber.equal('3');

          const tokensListed = await Promise.all([0, 1, 2].map(i => this.token.tokenByIndex(i)));
          const expectedTokens = [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(
            x => x !== tokenId,
          );
          expect(tokensListed.map(t => t.toNumber())).to.have.members(expectedTokens.map(t => t.toNumber()));
        });
      });
    });
  });

  describe('_mint(address, uint256)', function () {
    it('reverts with a null destination address', async function () {
      await expectRevert(this.token.$_mint(ZERO_ADDRESS, firstTokenId), 'ERC721: mint to the zero address');
    });

    context('with minted token', async function () {
      beforeEach(async function () {
        this.receipt = await this.token.$_mint(owner, firstTokenId);
      });

      it('adjusts owner tokens by index', async function () {
        expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(firstTokenId);
      });

      it('adjusts all tokens list', async function () {
        expect(await this.token.tokenByIndex(0)).to.be.bignumber.equal(firstTokenId);
      });
    });
  });

  describe('_burn', function () {
    it('reverts when burning a non-existent token id', async function () {
      await expectRevert(this.token.$_burn(firstTokenId), 'ERC721: invalid token ID');
    });

    context('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.$_mint(owner, firstTokenId);
        await this.token.$_mint(owner, secondTokenId);
      });

      context('with burnt token', function () {
        beforeEach(async function () {
          this.receipt = await this.token.$_burn(firstTokenId);
        });

        it('removes that token from the token list of the owner', async function () {
          expect(await this.token.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(secondTokenId);
        });

        it('adjusts all tokens list', async function () {
          expect(await this.token.tokenByIndex(0)).to.be.bignumber.equal(secondTokenId);
        });

        it('burns all tokens', async function () {
          await this.token.$_burn(secondTokenId, { from: owner });
          expect(await this.token.totalSupply()).to.be.bignumber.equal('0');
          await expectRevert(this.token.tokenByIndex(0), 'ERC721Enumerable: global index out of bounds');
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Metadata(errorPrefix, name, symbol, owner) {
  shouldSupportInterfaces(['ERC721Metadata']);

  describe('metadata', function () {
    it('has a name', async function () {
      expect(await this.token.name()).to.be.equal(name);
    });

    it('has a symbol', async function () {
      expect(await this.token.symbol()).to.be.equal(symbol);
    });

    describe('token URI', function () {
      beforeEach(async function () {
        await this.token.$_mint(owner, firstTokenId);
      });

      it('return empty string by default', async function () {
        expect(await this.token.tokenURI(firstTokenId)).to.be.equal('');
      });

      it('reverts when queried for non existent token id', async function () {
        await expectRevert(this.token.tokenURI(nonExistentTokenId), 'ERC721: invalid token ID');
      });

      describe('base URI', function () {
        beforeEach(function () {
          if (this.token.setBaseURI === undefined) {
            this.skip();
          }
        });

        it('base URI can be set', async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.baseURI()).to.equal(baseURI);
        });

        it('base URI is added as a prefix to the token URI', async function () {
          await this.token.setBaseURI(baseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(baseURI + firstTokenId.toString());
        });

        it('token URI can be changed by changing the base URI', async function () {
          await this.token.setBaseURI(baseURI);
          const newBaseURI = 'https://api.example.com/v2/';
          await this.token.setBaseURI(newBaseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.be.equal(newBaseURI + firstTokenId.toString());
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Enumerable,
  shouldBehaveLikeERC721Metadata,
};
