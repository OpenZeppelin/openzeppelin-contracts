const { ethers } = require('hardhat');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');
const {
  bigint: { Enum },
} = require('../../helpers/enums');

const RevertType = Enum('None', 'RevertWithoutMessage', 'RevertWithMessage', 'RevertWithCustomError', 'Panic');

const firstTokenId = 5042n;
const secondTokenId = 79217n;
const nonExistentTokenId = 13n;
const fourthTokenId = 4n;
const baseURI = 'https://api.example.com/v1/';

const RECEIVER_MAGIC_VALUE = '0x150b7a02';

function shouldBehaveLikeERC721() {
  shouldSupportInterfaces(['ERC165', 'ERC721']);

  describe('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.owner, firstTokenId);
      await this.token.$_mint(this.owner, secondTokenId);
      this.toWhom = this.other; // default to other for toWhom in describe-dependent tests
    });

    describe('balanceOf', function () {
      it('when the given address owns some tokens', async function () {
        expect(await this.token.balanceOf(this.owner)).to.equal(2n);
      });

      it('when the given address does not own any tokens', async function () {
        expect(await this.token.balanceOf(this.other)).to.equal(0n);
      });

      it('reverts when querying the zero address', async function () {
        await expect(this.token.balanceOf(ethers.ZeroAddress))
          .to.be.revertedWithCustomError(this.token, 'ERC721InvalidOwner')
          .withArgs(ethers.ZeroAddress);
      });
    });

    describe('ownerOf', function () {
      it('when the given token ID was tracked by this token', async function () {
        expect(await this.token.ownerOf(firstTokenId)).to.equal(this.owner.address);
      });

      it('reverts when the given token ID was not tracked by this token', async function () {
        await expect(this.token.ownerOf(nonExistentTokenId))
          .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
          .withArgs(nonExistentTokenId);
      });
    });

    describe('transfers', function () {
      const tokenId = firstTokenId;
      const data = '0x42';

      beforeEach(async function () {
        await this.token.connect(this.owner).approve(this.approved, tokenId);
        await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
      });

      const transferWasSuccessful = function () {
        it('transfers the ownership of the given token ID to the given address', async function () {
          expect(await this.token.ownerOf(tokenId)).to.equal(this.toWhom.address);
        });

        it('emits a Transfer event', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.owner.address, this.toWhom.address, tokenId);
        });

        it('clears the approval for the token ID with no event', async function () {
          expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
          await expect(this.tx).to.not.emit(this.token, 'Approval');
        });

        it('adjusts owners balances', async function () {
          expect(await this.token.balanceOf(this.owner)).to.equal(1n);
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          expect(await this.token.tokenOfOwnerByIndex(this.toWhom, 0)).to.equal(tokenId);

          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0)).to.not.equal(tokenId);
        });
      };

      const shouldTransferTokensByUsers = function (opts = {}) {
        describe('when called by the owner', function () {
          beforeEach(async function () {
            this.tx = await this.transfer(this.owner, this.owner, this.toWhom, tokenId);
          });

          transferWasSuccessful();
        });

        describe('when called by the approved individual', function () {
          beforeEach(async function () {
            this.tx = await this.transfer(this.approved, this.owner, this.toWhom, tokenId);
          });

          transferWasSuccessful();
        });

        describe('when called by the operator', function () {
          beforeEach(async function () {
            this.tx = await this.transfer(this.operator, this.owner, this.toWhom, tokenId);
          });

          transferWasSuccessful();
        });

        describe('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).approve(ethers.ZeroAddress, tokenId);
            this.tx = await this.transfer(this.operator, this.owner, this.toWhom, tokenId);
          });

          transferWasSuccessful();
        });

        describe('when sent to the owner', function () {
          beforeEach(async function () {
            this.tx = await this.transfer(this.owner, this.owner, this.owner, tokenId);
          });

          it('keeps ownership of the token', async function () {
            expect(await this.token.ownerOf(tokenId)).to.equal(this.owner.address);
          });

          it('clears the approval for the token ID', async function () {
            expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
          });

          it('emits only a transfer event', async function () {
            await expect(this.tx)
              .to.emit(this.token, 'Transfer')
              .withArgs(this.owner.address, this.owner.address, tokenId);
          });

          it('keeps the owner balance', async function () {
            expect(await this.token.balanceOf(this.owner)).to.equal(2n);
          });

          it('keeps same tokens by index', async function () {
            if (!this.token.tokenOfOwnerByIndex) return;
            expect(await Promise.all([0, 1].map(i => this.token.tokenOfOwnerByIndex(this.owner, i)))).to.have.members([
              firstTokenId,
              secondTokenId,
            ]);
          });
        });

        describe('reverts', function () {
          it('when the address of the previous owner is incorrect', async function () {
            await expect(this.transfer(this.owner, this.other, this.other, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721IncorrectOwner')
              .withArgs(this.other.address, tokenId, this.owner.address);
          });

          if (opts.unrestricted) {
            it('does not revert when the sender is not authorized for the token id unrestricted', async function () {
              await this.transfer(this.other, this.owner, this.other, tokenId);
            });
          } else {
            it('reverts when the sender is not authorized for the token id', async function () {
              await expect(this.transfer(this.other, this.owner, this.other, tokenId))
                .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
                .withArgs(this.other.address, tokenId);
            });
          }

          it('when the given token ID does not exist', async function () {
            await expect(this.transfer(this.owner, this.owner, this.other, nonExistentTokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
              .withArgs(nonExistentTokenId);
          });

          it('when the address to transfer the token to is the zero address', async function () {
            await expect(this.transfer(this.owner, this.owner, ethers.ZeroAddress, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(ethers.ZeroAddress);
          });
        });
      };

      const shouldTransferSafely = function (transferFun, data, opts = {}) {
        describe('to a user account', function () {
          shouldTransferTokensByUsers(transferFun, opts);
        });

        describe('to a valid receiver contract', function () {
          beforeEach(async function () {
            this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, RevertType.None);
            this.toWhom = this.receiver.address;
          });

          shouldTransferTokensByUsers(transferFun, opts);

          it('calls onERC721Received', async function () {
            const receipt = await transferFun.call(this, this.owner, this.receiver.address, tokenId, {
              from: this.owner,
            });

            await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
              operator: this.owner,
              from: this.owner,
              tokenId: tokenId,
              data: data,
            });
          });

          it('calls onERC721Received from approved', async function () {
            const receipt = await transferFun.call(this, this.owner, this.receiver.address, tokenId, {
              from: this.approved,
            });

            await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
              operator: this.approved,
              from: this.owner,
              tokenId: tokenId,
              data: data,
            });
          });

          describe('with an invalid token id', function () {
            it('reverts', async function () {
              await expectRevertCustomError(
                transferFun.call(this, this.owner, this.receiver.address, nonExistentTokenId, { from: this.owner }),
                'ERC721NonexistentToken',
                [nonExistentTokenId],
              );
            });
          });
        });
      };

      for (const { fnName, opts } of [
        { fnName: 'transferFrom', opts: {} },
        { fnName: '$_transfer', opts: { unrestricted: true } },
      ]) {
        describe(`via ${fnName}`, function () {
          beforeEach(function () {
            this.transfer = (operator, from, to, tokenId) =>
              this.token.connect(operator).getFunction(fnName)(from, to, tokenId);
          });

          shouldTransferTokensByUsers(opts);
        });
      }

      for (const { fnName, opts } of [
        { fnName: 'safeTransferFrom', opts: {} },
        { fnName: '$_safeTransfer', opts: { unrestricted: true } },
      ]) {
        describe(`via ${fnName}`, function () {
          const safeTransferFromWithData = function (from, to, tokenId, opts) {
            return this.token.methods[fnName + '(address,address,uint256,bytes)'](from, to, tokenId, data, opts);
          };

          const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
            return this.token.methods[fnName + '(address,address,uint256)'](from, to, tokenId, opts);
          };

          describe('with data', function () {
            shouldTransferSafely(safeTransferFromWithData, data, opts);
          });

          describe('without data', function () {
            shouldTransferSafely(safeTransferFromWithoutData, null, opts);
          });

          describe('to a receiver contract returning unexpected value', function () {
            it('reverts', async function () {
              const invalidReceiver = await ERC721ReceiverMock.new('0x42', RevertType.None);
              await expectRevertCustomError(
                this.token.methods[fnName + '(address,address,uint256)'](this.owner, invalidReceiver.address, tokenId, {
                  from: this.owner,
                }),
                'ERC721InvalidReceiver',
                [invalidReceiver.address],
              );
            });
          });

          describe('to a receiver contract that reverts with message', function () {
            it('reverts', async function () {
              const revertingReceiver = await ERC721ReceiverMock.new(
                RECEIVER_MAGIC_VALUE,
                RevertType.RevertWithMessage,
              );
              await expectRevert(
                this.token.methods[fnName + '(address,address,uint256)'](
                  this.owner,
                  revertingReceiver.address,
                  tokenId,
                  {
                    from: this.owner,
                  },
                ),
                'ERC721ReceiverMock: reverting',
              );
            });
          });

          describe('to a receiver contract that reverts without message', function () {
            it('reverts', async function () {
              const revertingReceiver = await ERC721ReceiverMock.new(
                RECEIVER_MAGIC_VALUE,
                RevertType.RevertWithoutMessage,
              );
              await expectRevertCustomError(
                this.token.methods[fnName + '(address,address,uint256)'](
                  this.owner,
                  revertingReceiver.address,
                  tokenId,
                  {
                    from: this.owner,
                  },
                ),
                'ERC721InvalidReceiver',
                [revertingReceiver.address],
              );
            });
          });

          describe('to a receiver contract that reverts with custom error', function () {
            it('reverts', async function () {
              const revertingReceiver = await ERC721ReceiverMock.new(
                RECEIVER_MAGIC_VALUE,
                RevertType.RevertWithCustomError,
              );
              await expectRevertCustomError(
                this.token.methods[fnName + '(address,address,uint256)'](
                  this.owner,
                  revertingReceiver.address,
                  tokenId,
                  {
                    from: this.owner,
                  },
                ),
                'CustomError',
                [RECEIVER_MAGIC_VALUE],
              );
            });
          });

          describe('to a receiver contract that panics', function () {
            it('reverts', async function () {
              const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, RevertType.Panic);
              await expectRevert.unspecified(
                this.token.methods[fnName + '(address,address,uint256)'](
                  this.owner,
                  revertingReceiver.address,
                  tokenId,
                  {
                    from: this.owner,
                  },
                ),
              );
            });
          });

          describe('to a contract that does not implement the required function', function () {
            it('reverts', async function () {
              const nonReceiver = await CallReceiverMock.new();
              await expectRevertCustomError(
                this.token.methods[fnName + '(address,address,uint256)'](this.owner, nonReceiver.address, tokenId, {
                  from: this.owner,
                }),
                'ERC721InvalidReceiver',
                [nonReceiver.address],
              );
            });
          });
        });
      }
    });

    describe('safe mint', function () {
      const tokenId = fourthTokenId;
      const data = '0x42';

      describe('via safeMint', function () {
        // regular minting is tested in ERC721Mintable.test.js and others
        it('calls onERC721Received — with data', async function () {
          this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, RevertType.None);
          const receipt = await this.token.$_safeMint(this.receiver.address, tokenId, data);

          await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            from: ethers.ZeroAddress,
            tokenId: tokenId,
            data: data,
          });
        });

        it('calls onERC721Received — without data', async function () {
          this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, RevertType.None);
          const receipt = await this.token.$_safeMint(this.receiver.address, tokenId);

          await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            from: ethers.ZeroAddress,
            tokenId: tokenId,
          });
        });

        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', RevertType.None);
            await expectRevertCustomError(
              this.token.$_safeMint(invalidReceiver.address, tokenId),
              'ERC721InvalidReceiver',
              [invalidReceiver.address],
            );
          });
        });

        describe('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, RevertType.RevertWithMessage);
            await expectRevert(
              this.token.$_safeMint(revertingReceiver.address, tokenId),
              'ERC721ReceiverMock: reverting',
            );
          });
        });

        describe('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            );
            await expectRevertCustomError(
              this.token.$_safeMint(revertingReceiver.address, tokenId),
              'ERC721InvalidReceiver',
              [revertingReceiver.address],
            );
          });
        });

        describe('to a receiver contract that reverts with custom error', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            );
            await expectRevertCustomError(this.token.$_safeMint(revertingReceiver.address, tokenId), 'CustomError', [
              RECEIVER_MAGIC_VALUE,
            ]);
          });
        });

        describe('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, RevertType.Panic);
            await expectRevert.unspecified(this.token.$_safeMint(revertingReceiver.address, tokenId));
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = await CallReceiverMock.new();
            await expectRevertCustomError(
              this.token.$_safeMint(nonReceiver.address, tokenId),
              'ERC721InvalidReceiver',
              [nonReceiver.address],
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
          expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
        });
      };

      const itApproves = function (address) {
        it('sets the approval for the target address', async function () {
          expect(await this.token.getApproved(tokenId)).to.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it('emits an approval event', async function () {
          expectEvent(receipt, 'Approval', {
            owner: this.owner,
            approved: address,
            tokenId: tokenId,
          });
        });
      };

      describe('when clearing approval', function () {
        describe('when there was no prior approval', function () {
          beforeEach(async function () {
            receipt = await this.token.approve(ethers.ZeroAddress, tokenId, { from: this.owner });
          });

          itClearsApproval();
          itEmitsApprovalEvent(ethers.ZeroAddress);
        });

        describe('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.approve(this.approved, tokenId, { from: this.owner });
            receipt = await this.token.approve(ethers.ZeroAddress, tokenId, { from: this.owner });
          });

          itClearsApproval();
          itEmitsApprovalEvent(ethers.ZeroAddress);
        });
      });

      describe('when approving a non-zero address', function () {
        describe('when there was no prior approval', function () {
          beforeEach(async function () {
            receipt = await this.token.approve(this.approved, tokenId, { from: this.owner });
          });

          itApproves(this.approved);
          itEmitsApprovalEvent(this.approved);
        });

        describe('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.approve(this.approved, tokenId, { from: this.owner });
            receipt = await this.token.approve(this.approved, tokenId, { from: this.owner });
          });

          itApproves(this.approved);
          itEmitsApprovalEvent(this.approved);
        });

        describe('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.approve(this.anotherApproved, tokenId, { from: this.owner });
            receipt = await this.token.approve(this.anotherApproved, tokenId, { from: this.owner });
          });

          itApproves(this.anotherApproved);
          itEmitsApprovalEvent(this.anotherApproved);
        });
      });

      describe('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.approve(this.approved, tokenId, { from: this.other }),
            'ERC721InvalidApprover',
            [this.other],
          );
        });
      });

      describe('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.approve(this.approved, tokenId, { from: this.owner });
          await expectRevertCustomError(
            this.token.approve(this.anotherApproved, tokenId, { from: this.approved }),
            'ERC721InvalidApprover',
            [this.approved],
          );
        });
      });

      describe('when the sender is an operator', function () {
        beforeEach(async function () {
          await this.token.setApprovalForAll(this.operator, true, { from: this.owner });
          receipt = await this.token.approve(this.approved, tokenId, { from: this.operator });
        });

        itApproves(this.approved);
        itEmitsApprovalEvent(this.approved);
      });

      describe('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.approve(this.approved, nonExistentTokenId, { from: this.operator }),
            'ERC721NonexistentToken',
            [nonExistentTokenId],
          );
        });
      });
    });

    describe('setApprovalForAll', function () {
      describe('when the operator willing to approve is not the owner', function () {
        describe('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.setApprovalForAll(this.operator, true, { from: this.owner });

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const receipt = await this.token.setApprovalForAll(this.operator, true, { from: this.owner });

            expectEvent(receipt, 'ApprovalForAll', {
              owner: this.owner,
              operator: this.operator,
              approved: true,
            });
          });
        });

        describe('when the operator was set as not approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(this.operator, false, { from: this.owner });
          });

          it('approves the operator', async function () {
            await this.token.setApprovalForAll(this.operator, true, { from: this.owner });

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const receipt = await this.token.setApprovalForAll(this.operator, true, { from: this.owner });

            expectEvent(receipt, 'ApprovalForAll', {
              owner: this.owner,
              operator: this.operator,
              approved: true,
            });
          });

          it('can unset the operator approval', async function () {
            await this.token.setApprovalForAll(this.operator, false, { from: this.owner });

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.equal(false);
          });
        });

        describe('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(this.operator, true, { from: this.owner });
          });

          it('keeps the approval to the given address', async function () {
            await this.token.setApprovalForAll(this.operator, true, { from: this.owner });

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.equal(true);
          });

          it('emits an approval event', async function () {
            const receipt = await this.token.setApprovalForAll(this.operator, true, { from: this.owner });

            expectEvent(receipt, 'ApprovalForAll', {
              owner: this.owner,
              operator: this.operator,
              approved: true,
            });
          });
        });
      });

      describe('when the operator is address zero', function () {
        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.setApprovalForAll(constants.ZERO_ADDRESS, true, { from: this.owner }),
            'ERC721InvalidOperator',
            [constants.ZERO_ADDRESS],
          );
        });
      });
    });

    describe('getApproved', async function () {
      describe('when token is not minted', async function () {
        it('reverts', async function () {
          await expectRevertCustomError(this.token.getApproved(nonExistentTokenId), 'ERC721NonexistentToken', [
            nonExistentTokenId,
          ]);
        });
      });

      describe('when token has been minted ', async function () {
        it('should return the zero address', async function () {
          expect(await this.token.getApproved(firstTokenId)).to.equal(ethers.ZeroAddress);
        });

        describe('when account has been approved', async function () {
          beforeEach(async function () {
            await this.token.approve(this.approved, firstTokenId, { from: this.owner });
          });

          it('returns approved account', async function () {
            expect(await this.token.getApproved(firstTokenId)).to.equal(this.approved);
          });
        });
      });
    });
  });

  describe('_mint(address, uint256)', function () {
    it('reverts with a null destination address', async function () {
      await expectRevertCustomError(this.token.$_mint(ethers.ZeroAddress, firstTokenId), 'ERC721InvalidReceiver', [
        ethers.ZeroAddress,
      ]);
    });

    describe('with minted token', async function () {
      beforeEach(async function () {
        this.receipt = await this.token.$_mint(this.owner, firstTokenId);
      });

      it('emits a Transfer event', function () {
        expectEvent(this.receipt, 'Transfer', { from: ethers.ZeroAddress, to: this.owner, tokenId: firstTokenId });
      });

      it('creates the token', async function () {
        expect(await this.token.balanceOf(this.owner)).to.be.bignumber.equal('1');
        expect(await this.token.ownerOf(firstTokenId)).to.equal(this.owner);
      });

      it('reverts when adding a token id that already exists', async function () {
        await expectRevertCustomError(this.token.$_mint(this.owner, firstTokenId), 'ERC721InvalidSender', [
          ethers.ZeroAddress,
        ]);
      });
    });
  });

  describe('_burn', function () {
    it('reverts when burning a non-existent token id', async function () {
      await expectRevertCustomError(this.token.$_burn(nonExistentTokenId), 'ERC721NonexistentToken', [
        nonExistentTokenId,
      ]);
    });

    describe('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.owner, firstTokenId);
        await this.token.$_mint(this.owner, secondTokenId);
      });

      describe('with burnt token', function () {
        beforeEach(async function () {
          this.receipt = await this.token.$_burn(firstTokenId);
        });

        it('emits a Transfer event', function () {
          expectEvent(this.receipt, 'Transfer', { from: this.owner, to: ethers.ZeroAddress, tokenId: firstTokenId });
        });

        it('deletes the token', async function () {
          expect(await this.token.balanceOf(this.owner)).to.be.bignumber.equal('1');
          await expectRevertCustomError(this.token.ownerOf(firstTokenId), 'ERC721NonexistentToken', [firstTokenId]);
        });

        it('reverts when burning a token id that has been deleted', async function () {
          await expectRevertCustomError(this.token.$_burn(firstTokenId), 'ERC721NonexistentToken', [firstTokenId]);
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Enumerable(owner, newOwner, approved, anotherApproved, operator, other) {
  shouldSupportInterfaces(['ERC721Enumerable']);

  describe('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(owner, firstTokenId);
      await this.token.$_mint(owner, secondTokenId);
      this.toWhom = other; // default to other for toWhom in describe-dependent tests
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
          await expectRevertCustomError(this.token.tokenOfOwnerByIndex(owner, 2), 'ERC721OutOfBoundsIndex', [owner, 2]);
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await expectRevertCustomError(this.token.tokenOfOwnerByIndex(other, 0), 'ERC721OutOfBoundsIndex', [other, 0]);
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
          await expectRevertCustomError(this.token.tokenOfOwnerByIndex(owner, 0), 'ERC721OutOfBoundsIndex', [owner, 0]);
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
        await expectRevertCustomError(this.token.tokenByIndex(2), 'ERC721OutOfBoundsIndex', [ethers.ZeroAddress, 2]);
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
      await expectRevertCustomError(this.token.$_mint(ethers.ZeroAddress, firstTokenId), 'ERC721InvalidReceiver', [
        ethers.ZeroAddress,
      ]);
    });

    describe('with minted token', async function () {
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
      await expectRevertCustomError(this.token.$_burn(firstTokenId), 'ERC721NonexistentToken', [firstTokenId]);
    });

    describe('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.$_mint(owner, firstTokenId);
        await this.token.$_mint(owner, secondTokenId);
      });

      describe('with burnt token', function () {
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
          await expectRevertCustomError(this.token.tokenByIndex(0), 'ERC721OutOfBoundsIndex', [ethers.ZeroAddress, 0]);
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Metadata(name, symbol, owner) {
  shouldSupportInterfaces(['ERC721Metadata']);

  describe('metadata', function () {
    it('has a name', async function () {
      expect(await this.token.name()).to.equal(name);
    });

    it('has a symbol', async function () {
      expect(await this.token.symbol()).to.equal(symbol);
    });

    describe('token URI', function () {
      beforeEach(async function () {
        await this.token.$_mint(owner, firstTokenId);
      });

      it('return empty string by default', async function () {
        expect(await this.token.tokenURI(firstTokenId)).to.equal('');
      });

      it('reverts when queried for non existent token id', async function () {
        await expectRevertCustomError(this.token.tokenURI(nonExistentTokenId), 'ERC721NonexistentToken', [
          nonExistentTokenId,
        ]);
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
          expect(await this.token.tokenURI(firstTokenId)).to.equal(baseURI + firstTokenId.toString());
        });

        it('token URI can be changed by changing the base URI', async function () {
          await this.token.setBaseURI(baseURI);
          const newBaseURI = 'https://api.example.com/v2/';
          await this.token.setBaseURI(newBaseURI);
          expect(await this.token.tokenURI(firstTokenId)).to.equal(newBaseURI + firstTokenId.toString());
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
