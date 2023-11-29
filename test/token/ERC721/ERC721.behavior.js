const { ethers } = require('hardhat');
const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

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
const RECEIVER_INCORRECT_VALUE = '0x42000000';

function shouldBehaveLikeERC721() {
  describe('base', function () {
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
            expect(await this.token.ownerOf(tokenId)).to.equal(await this.toWhom.getAddress());
          });

          it('emits a Transfer event', async function () {
            await expect(this.tx)
              .to.emit(this.token, 'Transfer')
              .withArgs(this.owner.address, await this.toWhom.getAddress(), tokenId);
          });

          it('clears the approval for the token ID with no event', async function () {
            expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
            await expect(this.tx).to.not.emit(this.token, 'Approval');
          });

          it('adjusts owners balances', async function () {
            await expect(this.tx).to.changeTokenBalance(this.token, this.owner, -1);
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
              await expect(this.tx).to.changeTokenBalance(this.token, this.owner, 0);
            });

            it('keeps same tokens by index', async function () {
              if (!this.token.tokenOfOwnerByIndex) return;
              expect(await Promise.all([0, 1].map(i => this.token.tokenOfOwnerByIndex(this.owner, i)))).to.have.members(
                [firstTokenId, secondTokenId],
              );
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

        const shouldTransferSafely = function (data, opts = {}) {
          describe('to a user account', function () {
            shouldTransferTokensByUsers(opts);
          });

          describe('to a valid receiver contract', function () {
            beforeEach(async function () {
              this.receiver = await ethers.deployContract('ERC721ReceiverMock', [
                RECEIVER_MAGIC_VALUE,
                RevertType.None,
              ]);
              this.toWhom = this.receiver;
            });

            shouldTransferTokensByUsers(opts);

            it('calls onERC721Received', async function () {
              await expect(this.transfer(this.owner, this.owner, this.receiver, tokenId))
                .to.emit(this.receiver, 'Received')
                .withArgs(this.owner.address, this.owner.address, tokenId, data, anyValue);
            });

            it('calls onERC721Received from approved', async function () {
              await expect(this.transfer(this.approved, this.owner, this.receiver, tokenId))
                .to.emit(this.receiver, 'Received')
                .withArgs(this.approved.address, this.owner.address, tokenId, data, anyValue);
            });

            it('reverts with an invalid token id', async function () {
              await expect(this.transfer(this.owner, this.owner, this.receiver, nonExistentTokenId))
                .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
                .withArgs(nonExistentTokenId);
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
            describe('WithData', function () {
              beforeEach(function () {
                this.transfer = (operator, from, to, tokenId) =>
                  this.token.connect(operator).getFunction(`${fnName}(address,address,uint256,bytes)`)(
                    from,
                    to,
                    tokenId,
                    data,
                  );
              });

              shouldTransferSafely(data, opts);
            });

            describe('WithoutData', function () {
              beforeEach(function () {
                this.transfer = (operator, from, to, tokenId) =>
                  this.token.connect(operator).getFunction(`${fnName}(address,address,uint256)`)(from, to, tokenId);
              });

              shouldTransferSafely('0x', opts);
            });

            describe('reverts', function () {
              it('to a receiver contract returning unexpected value', async function () {
                const invalidReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                  RECEIVER_INCORRECT_VALUE,
                  RevertType.None,
                ]);

                await expect(
                  this.token.connect(this.owner).getFunction(`${fnName}(address,address,uint256)`)(
                    this.owner,
                    invalidReceiver,
                    tokenId,
                  ),
                )
                  .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
                  .withArgs(invalidReceiver.target);
              });

              it('to a receiver contract that reverts with message', async function () {
                const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                  RECEIVER_MAGIC_VALUE,
                  RevertType.RevertWithMessage,
                ]);

                await expect(
                  this.token.connect(this.owner).getFunction(`${fnName}(address,address,uint256)`)(
                    this.owner,
                    revertingReceiver,
                    tokenId,
                  ),
                ).to.be.revertedWith('ERC721ReceiverMock: reverting');
              });

              it('to a receiver contract that reverts without message', async function () {
                const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                  RECEIVER_MAGIC_VALUE,
                  RevertType.RevertWithoutMessage,
                ]);

                await expect(
                  this.token.connect(this.owner).getFunction(`${fnName}(address,address,uint256)`)(
                    this.owner,
                    revertingReceiver,
                    tokenId,
                  ),
                )
                  .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
                  .withArgs(revertingReceiver.target);
              });

              it('to a receiver contract that reverts with custom error', async function () {
                const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                  RECEIVER_MAGIC_VALUE,
                  RevertType.RevertWithCustomError,
                ]);

                await expect(
                  this.token.connect(this.owner).getFunction(`${fnName}(address,address,uint256)`)(
                    this.owner,
                    revertingReceiver,
                    tokenId,
                  ),
                )
                  .to.be.revertedWithCustomError(revertingReceiver, 'CustomError')
                  .withArgs(RECEIVER_MAGIC_VALUE);
              });

              it('to a receiver contract that panics', async function () {
                const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                  RECEIVER_MAGIC_VALUE,
                  RevertType.Panic,
                ]);

                await expect(
                  this.token.connect(this.owner).getFunction(`${fnName}(address,address,uint256)`)(
                    this.owner,
                    revertingReceiver,
                    tokenId,
                  ),
                ).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
              });

              it('to a contract that does not implement the required function', async function () {
                const nonReceiver = await ethers.deployContract('CallReceiverMock');

                await expect(
                  this.token.connect(this.owner).getFunction(`${fnName}(address,address,uint256)`)(
                    this.owner,
                    nonReceiver,
                    tokenId,
                  ),
                )
                  .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
                  .withArgs(nonReceiver.target);
              });
            });
          });
        }
      });

      describe('safe mint', function () {
        const tokenId = fourthTokenId;
        const data = '0x42';

        // regular minting is tested in ERC721Mintable.test.js and others
        it('calls onERC721Received — with data', async function () {
          this.receiver = await ethers.deployContract('ERC721ReceiverMock', [RECEIVER_MAGIC_VALUE, RevertType.None]);
          await expect(this.token.getFunction('$_safeMint(address,uint256,bytes)')(this.receiver, tokenId, data))
            .to.emit(this.receiver, 'Received')
            .withArgs(anyValue, ethers.ZeroAddress, tokenId, data, anyValue);
        });

        it('calls onERC721Received — without data', async function () {
          this.receiver = await ethers.deployContract('ERC721ReceiverMock', [RECEIVER_MAGIC_VALUE, RevertType.None]);
          await expect(await this.token.$_safeMint(this.receiver, tokenId))
            .to.emit(this.receiver, 'Received')
            .withArgs(anyValue, ethers.ZeroAddress, tokenId, '0x', anyValue);
        });

        describe('reverts', function () {
          it('to a receiver contract returning unexpected value', async function () {
            const invalidReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_INCORRECT_VALUE,
              RevertType.None,
            ]);
            await expect(this.token.$_safeMint(invalidReceiver, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(invalidReceiver.target);
          });

          it('to a receiver contract that reverts with message', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithMessage,
            ]);
            await expect(this.token.$_safeMint(revertingReceiver, tokenId)).to.be.rejectedWith(
              'ERC721ReceiverMock: reverting',
            );
          });

          it('to a receiver contract that reverts without message', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            ]);
            await expect(this.token.$_safeMint(revertingReceiver, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(revertingReceiver.target);
          });

          it('to a receiver contract that reverts with custom error', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            ]);
            await expect(this.token.$_safeMint(revertingReceiver, tokenId))
              .to.be.revertedWithCustomError(revertingReceiver, 'CustomError')
              .withArgs(RECEIVER_MAGIC_VALUE);
          });

          it('to a receiver contract that panics', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.Panic,
            ]);
            await expect(this.token.$_safeMint(revertingReceiver, tokenId)).to.be.revertedWithPanic(
              PANIC_CODES.DIVISION_BY_ZERO,
            );
          });

          it('to a contract that does not implement the required function', async function () {
            const nonReceiver = await ethers.deployContract('CallReceiverMock');
            await expect(this.token.$_safeMint(nonReceiver, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(nonReceiver.target);
          });
        });
      });

      describe('approve', function () {
        const tokenId = firstTokenId;

        const itEmitsApprovalEvent = function () {
          it('emits an approval event', async function () {
            await expect(this.tx)
              .to.emit(this.token, 'Approval')
              .withArgs(this.owner.address, this.address ?? ethers.ZeroAddress, tokenId);
          });
        };

        const itClearsApproval = function () {
          it('clears approval for the token', async function () {
            expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
          });

          itEmitsApprovalEvent();
        };

        const itApproves = function () {
          it('sets the approval for the target address', async function () {
            expect(await this.token.getApproved(tokenId)).to.equal(this.address);
          });

          itEmitsApprovalEvent();
        };

        describe('when clearing approval', function () {
          describe('when there was no prior approval', function () {
            beforeEach(async function () {
              this.tx = await this.token.connect(this.owner).approve(ethers.ZeroAddress, tokenId);
            });

            itClearsApproval();
          });

          describe('when there was a prior approval', function () {
            beforeEach(async function () {
              await this.token.connect(this.owner).approve(this.approved, tokenId);
              this.tx = await this.token.connect(this.owner).approve(ethers.ZeroAddress, tokenId);
            });

            itClearsApproval();
          });
        });

        describe('when approving a non-zero address', function () {
          describe('when there was no prior approval', function () {
            beforeEach(async function () {
              this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
              this.address = this.approved.address;
            });

            itApproves();
          });

          describe('when there was a prior approval to the same address', function () {
            beforeEach(async function () {
              await this.token.connect(this.owner).approve(this.approved, tokenId);
              this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
              this.address = this.approved.address;
            });

            itApproves();
          });

          describe('when there was a prior approval to a different address', function () {
            beforeEach(async function () {
              await this.token.connect(this.owner).approve(this.anotherApproved, tokenId);
              this.tx = await this.token.connect(this.owner).approve(this.anotherApproved, tokenId);
              this.address = this.anotherApproved.address;
            });

            itApproves();
          });
        });

        describe('when the sender is an operator', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
            this.tx = await this.token.connect(this.operator).approve(this.approved, tokenId);
            this.address = this.approved.address;
          });

          itApproves();
        });

        describe('reverts', function () {
          it('when the sender does not own the given token ID', async function () {
            await expect(this.token.connect(this.other).approve(this.approved, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidApprover')
              .withArgs(this.other.address);
          });

          it('when the sender is approved for the given token ID', async function () {
            await this.token.connect(this.owner).approve(this.approved, tokenId);
            await expect(this.token.connect(this.approved).approve(this.anotherApproved, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidApprover')
              .withArgs(this.approved.address);
          });

          it('when the given token ID does not exist', async function () {
            await expect(this.token.connect(this.operator).approve(this.approved, nonExistentTokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
              .withArgs(nonExistentTokenId);
          });
        });
      });

      describe('setApprovalForAll', function () {
        it('reverts when the operator is address zero', async function () {
          await expect(this.token.connect(this.owner).setApprovalForAll(ethers.ZeroAddress, true))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidOperator')
            .withArgs(ethers.ZeroAddress);
        });

        describe('when the operator willing to approve is not the owner', function () {
          describe('when there is no operator approval set by the sender', function () {
            beforeEach(async function () {
              this.tx = await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
            });

            it('approves the operator', async function () {
              expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.true;
            });

            it('emits an approval event', async function () {
              await expect(this.tx)
                .to.emit(this.token, 'ApprovalForAll')
                .withArgs(this.owner.address, this.operator.address, true);
            });
          });

          describe('when the operator was set as not approved', function () {
            beforeEach(async function () {
              await this.token.connect(this.owner).setApprovalForAll(this.operator, false);
            });

            describe('approves the operator', function () {
              beforeEach(async function () {
                this.tx = await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
              });

              it('approves the operator', async function () {
                expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.true;
              });

              it('emits an approval event', async function () {
                await expect(this.tx)
                  .to.emit(this.token, 'ApprovalForAll')
                  .withArgs(this.owner.address, this.operator.address, true);
              });
            });

            it('can unset the operator approval', async function () {
              await this.token.connect(this.owner).setApprovalForAll(this.operator, false);
              expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.false;
            });
          });

          describe('when the operator was already approved', function () {
            beforeEach(async function () {
              await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
              this.tx = await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
            });

            it('keeps the approval to the given address', async function () {
              expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.true;
            });

            it('emits an approval event', async function () {
              await expect(this.tx)
                .to.emit(this.token, 'ApprovalForAll')
                .withArgs(this.owner.address, this.operator.address, true);
            });
          });
        });
      });

      describe('getApproved', async function () {
        it('reverts when token is not minted', async function () {
          await expect(this.token.getApproved(nonExistentTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(nonExistentTokenId);
        });

        describe('when token has been minted ', async function () {
          it('should return the zero address', async function () {
            expect(await this.token.getApproved(firstTokenId)).to.equal(ethers.ZeroAddress);
          });

          it('when account has been approved', async function () {
            await this.token.connect(this.owner).approve(this.approved, firstTokenId);
            expect(await this.token.getApproved(firstTokenId)).to.equal(this.approved.address);
          });
        });
      });
    });

    describe('_mint(address, uint256)', function () {
      it('reverts with a null destination address', async function () {
        await expect(this.token.$_mint(ethers.ZeroAddress, firstTokenId))
          .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      describe('with minted token', async function () {
        beforeEach(async function () {
          this.tx = await this.token.$_mint(this.owner, firstTokenId);
        });

        it('emits a Transfer event', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.owner.address, firstTokenId);
        });

        it('creates the token', async function () {
          await expect(this.tx).to.changeTokenBalance(this.token, this.owner, 1);
          expect(await this.token.ownerOf(firstTokenId)).to.equal(this.owner.address);
        });

        it('reverts when adding a token id that already exists', async function () {
          await expect(this.token.$_mint(this.owner, firstTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidSender')
            .withArgs(ethers.ZeroAddress);
        });
      });
    });

    describe('_burn', function () {
      it('reverts when burning a non-existent token id', async function () {
        await expect(this.token.$_burn(nonExistentTokenId))
          .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
          .withArgs(nonExistentTokenId);
      });

      describe('with minted tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.owner, firstTokenId);
          this.tx = await this.token.$_burn(firstTokenId);
        });

        it('emits a Transfer event', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'Transfer')
            .withArgs(this.owner.address, ethers.ZeroAddress, firstTokenId);
        });

        it('deletes the token', async function () {
          await expect(this.tx).to.changeTokenBalance(this.token, this.owner, -1);
          await expect(this.token.ownerOf(firstTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(firstTokenId);
        });

        it('reverts when burning a token id that has been deleted', async function () {
          await expect(this.token.$_burn(firstTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(firstTokenId);
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Enumerable() {
  describe('enumerable', async function () {
    shouldSupportInterfaces(['ERC721Enumerable']);

    describe('with minted tokens', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.owner, firstTokenId);
        await this.token.$_mint(this.owner, secondTokenId);
        this.toWhom = this.other; // default to other for toWhom in describe-dependent tests
      });

      it('returns total token supply', async function () {
        expect(await this.token.totalSupply()).to.equal(2n);
      });

      describe('tokenOfOwnerByIndex', function () {
        it('when the given index is lower than the amount of tokens owned by the given address', async function () {
          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0)).to.equal(firstTokenId);
        });

        it('reverts when the index is greater than or equal to the total tokens owned by the given address', async function () {
          await expect(this.token.tokenOfOwnerByIndex(this.owner, 2))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(this.owner.address, 2);
        });

        it('reverts when the given address does not own any token', async function () {
          await expect(this.token.tokenOfOwnerByIndex(this.other, 0))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(this.other.address, 0);
        });

        describe('after transferring all tokens to another user', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).transferFrom(this.owner, this.other, firstTokenId);
            await this.token.connect(this.owner).transferFrom(this.owner, this.other, secondTokenId);
          });

          it('returns correct token IDs for target', async function () {
            expect(await Promise.all([0, 1].map(i => this.token.tokenOfOwnerByIndex(this.other, i)))).to.have.members([
              firstTokenId,
              secondTokenId,
            ]);
          });

          it('returns empty collection for original owner', async function () {
            expect(await this.token.balanceOf(this.owner)).to.equal(0n);
            await expect(this.token.tokenOfOwnerByIndex(this.owner, 0))
              .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
              .withArgs(this.owner.address, 0);
          });
        });
      });

      describe('tokenByIndex', function () {
        it('returns all tokens', async function () {
          expect(await Promise.all([0, 1].map(i => this.token.tokenByIndex(i)))).to.have.members([
            firstTokenId,
            secondTokenId,
          ]);
        });

        it('reverts if index is greater than supply', async function () {
          await expect(this.token.tokenByIndex(2))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(ethers.ZeroAddress, 2);
        });

        for (const tokenId of [firstTokenId, secondTokenId]) {
          it(`returns all tokens after burning token ${tokenId} and minting new tokens`, async function () {
            const newTokenId = 300n;
            const anotherNewTokenId = 400n;

            await this.token.$_burn(tokenId);
            await this.token.$_mint(this.newOwner, newTokenId);
            await this.token.$_mint(this.newOwner, anotherNewTokenId);

            expect(await this.token.totalSupply()).to.equal(3n);
            expect(await Promise.all([0, 1, 2].map(i => this.token.tokenByIndex(i)))).to.have.members(
              [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(x => x !== tokenId),
            );
          });
        }
      });
    });

    describe('_mint(address, uint256)', function () {
      it('reverts with a null destination address', async function () {
        await expect(this.token.$_mint(ethers.ZeroAddress, firstTokenId))
          .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });

      describe('with minted token', async function () {
        beforeEach(async function () {
          this.receipt = await this.token.$_mint(this.owner, firstTokenId);
        });

        it('adjusts owner tokens by index', async function () {
          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0)).to.equal(firstTokenId);
        });

        it('adjusts all tokens list', async function () {
          expect(await this.token.tokenByIndex(0)).to.equal(firstTokenId);
        });
      });
    });

    describe('_burn', function () {
      it('reverts when burning a non-existent token id', async function () {
        await expect(this.token.$_burn(firstTokenId))
          .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
          .withArgs(firstTokenId);
      });

      describe('with minted tokens', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.owner, firstTokenId);
          await this.token.$_mint(this.owner, secondTokenId);
          this.tx = await this.token.$_burn(firstTokenId);
        });

        it('removes that token from the token list of the owner', async function () {
          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0)).to.equal(secondTokenId);
        });

        it('adjusts all tokens list', async function () {
          expect(await this.token.tokenByIndex(0)).to.equal(secondTokenId);
        });

        it('burns all tokens', async function () {
          await this.token.connect(this.owner).$_burn(secondTokenId);
          expect(await this.token.totalSupply()).to.equal(0n);
          await expect(this.token.tokenByIndex(0))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(ethers.ZeroAddress, 0);
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Metadata({ hasUri } = {}) {
  describe('metadata', async function () {
    shouldSupportInterfaces(['ERC721Metadata']);

    describe('metadata', function () {
      it('has a name', async function () {
        expect(await this.token.name()).to.equal(this.name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(this.symbol);
      });

      describe('token URI', function () {
        beforeEach(async function () {
          await this.token.$_mint(this.owner, firstTokenId);
        });

        it('return empty string by default', async function () {
          expect(await this.token.tokenURI(firstTokenId)).to.equal('');
        });

        it('reverts when queried for non existent token id', async function () {
          await expect(this.token.tokenURI(nonExistentTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(nonExistentTokenId);
        });

        if (hasUri)
          describe('base URI', function () {
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
  });
}

module.exports = {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Enumerable,
  shouldBehaveLikeERC721Metadata,
};
