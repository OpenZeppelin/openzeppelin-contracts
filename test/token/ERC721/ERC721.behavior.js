const { ethers } = require('hardhat');
const { expect } = require('chai');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');
const { RevertType } = require('../../helpers/enums');

const firstTokenId = 5042n;
const secondTokenId = 79217n;
const nonExistentTokenId = 13n;
const fourthTokenId = 4n;
const baseURI = 'https://api.example.com/v1/';

const RECEIVER_MAGIC_VALUE = '0x150b7a02';

function shouldBehaveLikeERC721() {
  beforeEach(async function () {
    const [owner, newOwner, approved, operator, other] = this.accounts;
    Object.assign(this, { owner, newOwner, approved, operator, other });
  });

  shouldSupportInterfaces(['ERC721']);

  describe('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.owner, firstTokenId);
      await this.token.$_mint(this.owner, secondTokenId);
      this.to = this.other;
    });

    describe('balanceOf', function () {
      describe('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          expect(await this.token.balanceOf(this.owner)).to.equal(2n);
        });
      });

      describe('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          expect(await this.token.balanceOf(this.other)).to.equal(0n);
        });
      });

      describe('when querying the zero address', function () {
        it('throws', async function () {
          await expect(this.token.balanceOf(ethers.ZeroAddress))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidOwner')
            .withArgs(ethers.ZeroAddress);
        });
      });
    });

    describe('ownerOf', function () {
      describe('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the owner of the given token ID', async function () {
          expect(await this.token.ownerOf(tokenId)).to.equal(this.owner);
        });
      });

      describe('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId;

        it('reverts', async function () {
          await expect(this.token.ownerOf(tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(tokenId);
        });
      });
    });

    describe('transfers', function () {
      const tokenId = firstTokenId;
      const data = '0x42';

      beforeEach(async function () {
        await this.token.connect(this.owner).approve(this.approved, tokenId);
        await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
      });

      const transferWasSuccessful = () => {
        it('transfers the ownership of the given token ID to the given address', async function () {
          await this.tx();
          expect(await this.token.ownerOf(tokenId)).to.equal(this.to);
        });

        it('emits a Transfer event', async function () {
          await expect(this.tx()).to.emit(this.token, 'Transfer').withArgs(this.owner, this.to, tokenId);
        });

        it('clears the approval for the token ID with no event', async function () {
          await expect(this.tx()).to.not.emit(this.token, 'Approval');

          expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
        });

        it('adjusts owners balances', async function () {
          const balanceBefore = await this.token.balanceOf(this.owner);
          await this.tx();
          expect(await this.token.balanceOf(this.owner)).to.equal(balanceBefore - 1n);
        });

        it('adjusts owners tokens by index', async function () {
          if (!this.token.tokenOfOwnerByIndex) return;

          await this.tx();
          expect(await this.token.tokenOfOwnerByIndex(this.to, 0n)).to.equal(tokenId);
          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0n)).to.not.equal(tokenId);
        });
      };

      const shouldTransferTokensByUsers = function (fragment, opts = {}) {
        describe('when called by the owner', function () {
          beforeEach(async function () {
            this.tx = () =>
              this.token.connect(this.owner)[fragment](this.owner, this.to, tokenId, ...(opts.extra ?? []));
          });
          transferWasSuccessful();
        });

        describe('when called by the approved individual', function () {
          beforeEach(async function () {
            this.tx = () =>
              this.token.connect(this.approved)[fragment](this.owner, this.to, tokenId, ...(opts.extra ?? []));
          });
          transferWasSuccessful();
        });

        describe('when called by the operator', function () {
          beforeEach(async function () {
            this.tx = () =>
              this.token.connect(this.operator)[fragment](this.owner, this.to, tokenId, ...(opts.extra ?? []));
          });
          transferWasSuccessful();
        });

        describe('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).approve(ethers.ZeroAddress, tokenId);
            this.tx = () =>
              this.token.connect(this.operator)[fragment](this.owner, this.to, tokenId, ...(opts.extra ?? []));
          });
          transferWasSuccessful();
        });

        describe('when sent to the owner', function () {
          beforeEach(async function () {
            this.tx = () =>
              this.token.connect(this.owner)[fragment](this.owner, this.owner, tokenId, ...(opts.extra ?? []));
          });

          it('keeps ownership of the token', async function () {
            await this.tx();
            expect(await this.token.ownerOf(tokenId)).to.equal(this.owner);
          });

          it('clears the approval for the token ID', async function () {
            await this.tx();
            expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
          });

          it('emits only a transfer event', async function () {
            await expect(this.tx()).to.emit(this.token, 'Transfer').withArgs(this.owner, this.owner, tokenId);
          });

          it('keeps the owner balance', async function () {
            const balanceBefore = await this.token.balanceOf(this.owner);
            await this.tx();
            expect(await this.token.balanceOf(this.owner)).to.equal(balanceBefore);
          });

          it('keeps same tokens by index', async function () {
            if (!this.token.tokenOfOwnerByIndex) return;

            expect(await Promise.all([0n, 1n].map(i => this.token.tokenOfOwnerByIndex(this.owner, i)))).to.have.members(
              [firstTokenId, secondTokenId],
            );
          });
        });

        describe('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await expect(
              this.token.connect(this.owner)[fragment](this.other, this.other, tokenId, ...(opts.extra ?? [])),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC721IncorrectOwner')
              .withArgs(this.other, tokenId, this.owner);
          });
        });

        describe('when the sender is not authorized for the token id', function () {
          if (opts.unrestricted) {
            it('does not revert', async function () {
              await this.token.connect(this.other)[fragment](this.owner, this.other, tokenId, ...(opts.extra ?? []));
            });
          } else {
            it('reverts', async function () {
              await expect(
                this.token.connect(this.other)[fragment](this.owner, this.other, tokenId, ...(opts.extra ?? [])),
              )
                .to.be.revertedWithCustomError(this.token, 'ERC721InsufficientApproval')
                .withArgs(this.other, tokenId);
            });
          }
        });

        describe('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await expect(
              this.token
                .connect(this.owner)
                [fragment](this.owner, this.other, nonExistentTokenId, ...(opts.extra ?? [])),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
              .withArgs(nonExistentTokenId);
          });
        });

        describe('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await expect(
              this.token.connect(this.owner)[fragment](this.owner, ethers.ZeroAddress, tokenId, ...(opts.extra ?? [])),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(ethers.ZeroAddress);
          });
        });
      };

      const shouldTransferSafely = function (fragment, data, opts = {}) {
        // sanity
        it('function exists', async function () {
          expect(this.token.interface.hasFunction(fragment)).to.be.true;
        });

        describe('to a user account', function () {
          shouldTransferTokensByUsers(fragment, opts);
        });

        describe('to a valid receiver contract', function () {
          beforeEach(async function () {
            this.to = await ethers.deployContract('ERC721ReceiverMock', [RECEIVER_MAGIC_VALUE, RevertType.None]);
          });

          shouldTransferTokensByUsers(fragment, opts);

          it('calls onERC721Received', async function () {
            await expect(this.token.connect(this.owner)[fragment](this.owner, this.to, tokenId, ...(opts.extra ?? [])))
              .to.emit(this.to, 'Received')
              .withArgs(this.owner, this.owner, tokenId, data, anyValue);
          });

          it('calls onERC721Received from approved', async function () {
            await expect(
              this.token.connect(this.approved)[fragment](this.owner, this.to, tokenId, ...(opts.extra ?? [])),
            )
              .to.emit(this.to, 'Received')
              .withArgs(this.approved, this.owner, tokenId, data, anyValue);
          });

          describe('with an invalid token id', function () {
            it('reverts', async function () {
              await expect(
                this.token
                  .connect(this.approved)
                  [fragment](this.owner, this.to, nonExistentTokenId, ...(opts.extra ?? [])),
              )
                .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
                .withArgs(nonExistentTokenId);
            });
          });
        });
      };

      for (const { fnName, opts } of [
        { fnName: 'transferFrom', opts: {} },
        { fnName: '$_transfer', opts: { unrestricted: true } },
      ]) {
        describe(`via ${fnName}`, function () {
          shouldTransferTokensByUsers(fnName, opts);
        });
      }

      for (const { fnName, opts } of [
        { fnName: 'safeTransferFrom', opts: {} },
        { fnName: '$_safeTransfer', opts: { unrestricted: true } },
      ]) {
        describe(`via ${fnName}`, function () {
          describe('with data', function () {
            shouldTransferSafely(fnName, data, { ...opts, extra: [ethers.Typed.bytes(data)] });
          });

          describe('without data', function () {
            shouldTransferSafely(fnName, '0x', opts);
          });

          describe('to a receiver contract returning unexpected value', function () {
            it('reverts', async function () {
              const invalidReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                '0xdeadbeef',
                RevertType.None,
              ]);

              await expect(this.token.connect(this.owner)[fnName](this.owner, invalidReceiver, tokenId))
                .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
                .withArgs(invalidReceiver);
            });
          });

          describe('to a receiver contract that reverts with message', function () {
            it('reverts', async function () {
              const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                RECEIVER_MAGIC_VALUE,
                RevertType.RevertWithMessage,
              ]);

              await expect(
                this.token.connect(this.owner)[fnName](this.owner, revertingReceiver, tokenId),
              ).to.be.revertedWith('ERC721ReceiverMock: reverting');
            });
          });

          describe('to a receiver contract that reverts without message', function () {
            it('reverts', async function () {
              const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                RECEIVER_MAGIC_VALUE,
                RevertType.RevertWithoutMessage,
              ]);

              await expect(this.token.connect(this.owner)[fnName](this.owner, revertingReceiver, tokenId))
                .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
                .withArgs(revertingReceiver);
            });
          });

          describe('to a receiver contract that reverts with custom error', function () {
            it('reverts', async function () {
              const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                RECEIVER_MAGIC_VALUE,
                RevertType.RevertWithCustomError,
              ]);

              await expect(this.token.connect(this.owner)[fnName](this.owner, revertingReceiver, tokenId))
                .to.be.revertedWithCustomError(revertingReceiver, 'CustomError')
                .withArgs(RECEIVER_MAGIC_VALUE);
            });
          });

          describe('to a receiver contract that panics', function () {
            it('reverts', async function () {
              const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
                RECEIVER_MAGIC_VALUE,
                RevertType.Panic,
              ]);

              await expect(
                this.token.connect(this.owner)[fnName](this.owner, revertingReceiver, tokenId),
              ).to.be.revertedWithPanic(PANIC_CODES.DIVISION_BY_ZERO);
            });
          });

          describe('to a contract that does not implement the required function', function () {
            it('reverts', async function () {
              const nonReceiver = await ethers.deployContract('CallReceiverMock');

              await expect(this.token.connect(this.owner)[fnName](this.owner, nonReceiver, tokenId))
                .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
                .withArgs(nonReceiver);
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
          const receiver = await ethers.deployContract('ERC721ReceiverMock', [RECEIVER_MAGIC_VALUE, RevertType.None]);

          await expect(await this.token.$_safeMint(receiver, tokenId, ethers.Typed.bytes(data)))
            .to.emit(receiver, 'Received')
            .withArgs(anyValue, ethers.ZeroAddress, tokenId, data, anyValue);
        });

        it('calls onERC721Received — without data', async function () {
          const receiver = await ethers.deployContract('ERC721ReceiverMock', [RECEIVER_MAGIC_VALUE, RevertType.None]);

          await expect(await this.token.$_safeMint(receiver, tokenId))
            .to.emit(receiver, 'Received')
            .withArgs(anyValue, ethers.ZeroAddress, tokenId, '0x', anyValue);
        });

        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ethers.deployContract('ERC721ReceiverMock', ['0xdeadbeef', RevertType.None]);

            await expect(this.token.$_safeMint(invalidReceiver, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(invalidReceiver);
          });
        });

        describe('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithMessage,
            ]);

            await expect(this.token.$_safeMint(revertingReceiver, tokenId)).to.be.revertedWith(
              'ERC721ReceiverMock: reverting',
            );
          });
        });

        describe('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithoutMessage,
            ]);

            await expect(this.token.$_safeMint(revertingReceiver, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(revertingReceiver);
          });
        });

        describe('to a receiver contract that reverts with custom error', function () {
          it('reverts', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.RevertWithCustomError,
            ]);

            await expect(this.token.$_safeMint(revertingReceiver, tokenId))
              .to.be.revertedWithCustomError(revertingReceiver, 'CustomError')
              .withArgs(RECEIVER_MAGIC_VALUE);
          });
        });

        describe('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ethers.deployContract('ERC721ReceiverMock', [
              RECEIVER_MAGIC_VALUE,
              RevertType.Panic,
            ]);

            await expect(this.token.$_safeMint(revertingReceiver, tokenId)).to.be.revertedWithPanic(
              PANIC_CODES.DIVISION_BY_ZERO,
            );
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = await ethers.deployContract('CallReceiverMock');

            await expect(this.token.$_safeMint(nonReceiver, tokenId))
              .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
              .withArgs(nonReceiver);
          });
        });
      });
    });

    describe('approve', function () {
      const tokenId = firstTokenId;

      const itClearsApproval = function () {
        it('clears approval for the token', async function () {
          expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
        });
      };

      const itApproves = function () {
        it('sets the approval for the target address', async function () {
          expect(await this.token.getApproved(tokenId)).to.equal(this.approved ?? this.approved);
        });
      };

      const itEmitsApprovalEvent = function () {
        it('emits an approval event', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'Approval')
            .withArgs(this.owner, this.approved ?? this.approved, tokenId);
        });
      };

      describe('when clearing approval', function () {
        describe('when there was no prior approval', function () {
          beforeEach(async function () {
            this.approved = ethers.ZeroAddress;
            this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
          });

          itClearsApproval();
          itEmitsApprovalEvent();
        });

        describe('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).approve(this.other, tokenId);
            this.approved = ethers.ZeroAddress;
            this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
          });

          itClearsApproval();
          itEmitsApprovalEvent();
        });
      });

      describe('when approving a non-zero address', function () {
        describe('when there was no prior approval', function () {
          beforeEach(async function () {
            this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
          });

          itApproves();
          itEmitsApprovalEvent();
        });

        describe('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).approve(this.approved, tokenId);
            this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
          });

          itApproves();
          itEmitsApprovalEvent();
        });

        describe('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).approve(this.other, tokenId);
            this.tx = await this.token.connect(this.owner).approve(this.approved, tokenId);
          });

          itApproves();
          itEmitsApprovalEvent();
        });
      });

      describe('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await expect(this.token.connect(this.other).approve(this.approved, tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidApprover')
            .withArgs(this.other);
        });
      });

      describe('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.connect(this.owner).approve(this.approved, tokenId);

          await expect(this.token.connect(this.approved).approve(this.other, tokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidApprover')
            .withArgs(this.approved);
        });
      });

      describe('when the sender is an operator', function () {
        beforeEach(async function () {
          await this.token.connect(this.owner).setApprovalForAll(this.operator, true);

          this.tx = await this.token.connect(this.operator).approve(this.approved, tokenId);
        });

        itApproves();
        itEmitsApprovalEvent();
      });

      describe('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await expect(this.token.connect(this.operator).approve(this.approved, nonExistentTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(nonExistentTokenId);
        });
      });
    });

    describe('setApprovalForAll', function () {
      describe('when the operator willing to approve is not the owner', function () {
        describe('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, true);

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.true;
          });

          it('emits an approval event', async function () {
            await expect(this.token.connect(this.owner).setApprovalForAll(this.operator, true))
              .to.emit(this.token, 'ApprovalForAll')
              .withArgs(this.owner, this.operator, true);
          });
        });

        describe('when the operator was set as not approved', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, false);
          });

          it('approves the operator', async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, true);

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.true;
          });

          it('emits an approval event', async function () {
            await expect(this.token.connect(this.owner).setApprovalForAll(this.operator, true))
              .to.emit(this.token, 'ApprovalForAll')
              .withArgs(this.owner, this.operator, true);
          });

          it('can unset the operator approval', async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, false);

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.false;
          });
        });

        describe('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, true);
          });

          it('keeps the approval to the given address', async function () {
            await this.token.connect(this.owner).setApprovalForAll(this.operator, true);

            expect(await this.token.isApprovedForAll(this.owner, this.operator)).to.be.true;
          });

          it('emits an approval event', async function () {
            await expect(this.token.connect(this.owner).setApprovalForAll(this.operator, true))
              .to.emit(this.token, 'ApprovalForAll')
              .withArgs(this.owner, this.operator, true);
          });
        });
      });

      describe('when the operator is address zero', function () {
        it('reverts', async function () {
          await expect(this.token.connect(this.owner).setApprovalForAll(ethers.ZeroAddress, true))
            .to.be.revertedWithCustomError(this.token, 'ERC721InvalidOperator')
            .withArgs(ethers.ZeroAddress);
        });
      });
    });

    describe('getApproved', async function () {
      describe('when token is not minted', async function () {
        it('reverts', async function () {
          await expect(this.token.getApproved(nonExistentTokenId))
            .to.be.revertedWithCustomError(this.token, 'ERC721NonexistentToken')
            .withArgs(nonExistentTokenId);
        });
      });

      describe('when token has been minted ', async function () {
        it('should return the zero address', async function () {
          expect(await this.token.getApproved(firstTokenId)).to.equal(ethers.ZeroAddress);
        });

        describe('when account has been approved', async function () {
          beforeEach(async function () {
            await this.token.connect(this.owner).approve(this.approved, firstTokenId);
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
      await expect(this.token.$_mint(ethers.ZeroAddress, firstTokenId))
        .to.be.revertedWithCustomError(this.token, 'ERC721InvalidReceiver')
        .withArgs(ethers.ZeroAddress);
    });

    describe('with minted token', async function () {
      beforeEach(async function () {
        this.tx = await this.token.$_mint(this.owner, firstTokenId);
      });

      it('emits a Transfer event', async function () {
        await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, this.owner, firstTokenId);
      });

      it('creates the token', async function () {
        expect(await this.token.balanceOf(this.owner)).to.equal(1n);
        expect(await this.token.ownerOf(firstTokenId)).to.equal(this.owner);
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
        await this.token.$_mint(this.owner, secondTokenId);
      });

      describe('with burnt token', function () {
        beforeEach(async function () {
          this.tx = await this.token.$_burn(firstTokenId);
        });

        it('emits a Transfer event', async function () {
          await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(this.owner, ethers.ZeroAddress, firstTokenId);
        });

        it('deletes the token', async function () {
          expect(await this.token.balanceOf(this.owner)).to.equal(1n);
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
  beforeEach(async function () {
    const [owner, newOwner, approved, operator, other] = this.accounts;
    Object.assign(this, { owner, newOwner, approved, operator, other });
  });

  shouldSupportInterfaces(['ERC721Enumerable']);

  describe('with minted tokens', function () {
    beforeEach(async function () {
      await this.token.$_mint(this.owner, firstTokenId);
      await this.token.$_mint(this.owner, secondTokenId);
      this.to = this.other;
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await this.token.totalSupply()).to.equal(2n);
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0n)).to.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await expect(this.token.tokenOfOwnerByIndex(this.owner, 2n))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(this.owner, 2n);
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await expect(this.token.tokenOfOwnerByIndex(this.other, 0n))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(this.other, 0n);
        });
      });

      describe('after transferring all tokens to another user', function () {
        beforeEach(async function () {
          await this.token.connect(this.owner).transferFrom(this.owner, this.other, firstTokenId);
          await this.token.connect(this.owner).transferFrom(this.owner, this.other, secondTokenId);
        });

        it('returns correct token IDs for target', async function () {
          expect(await this.token.balanceOf(this.other)).to.equal(2n);

          expect(await Promise.all([0n, 1n].map(i => this.token.tokenOfOwnerByIndex(this.other, i)))).to.have.members([
            firstTokenId,
            secondTokenId,
          ]);
        });

        it('returns empty collection for original owner', async function () {
          expect(await this.token.balanceOf(this.owner)).to.equal(0n);
          await expect(this.token.tokenOfOwnerByIndex(this.owner, 0n))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(this.owner, 0n);
        });
      });
    });

    describe('tokenByIndex', function () {
      it('returns all tokens', async function () {
        expect(await Promise.all([0n, 1n].map(i => this.token.tokenByIndex(i)))).to.have.members([
          firstTokenId,
          secondTokenId,
        ]);
      });

      it('reverts if index is greater than supply', async function () {
        await expect(this.token.tokenByIndex(2n))
          .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
          .withArgs(ethers.ZeroAddress, 2n);
      });

      for (const tokenId of [firstTokenId, secondTokenId]) {
        it(`returns all tokens after burning token ${tokenId} and minting new tokens`, async function () {
          const newTokenId = 300n;
          const anotherNewTokenId = 400n;

          await this.token.$_burn(tokenId);
          await this.token.$_mint(this.newOwner, newTokenId);
          await this.token.$_mint(this.newOwner, anotherNewTokenId);

          expect(await this.token.totalSupply()).to.equal(3n);

          expect(await Promise.all([0n, 1n, 2n].map(i => this.token.tokenByIndex(i))))
            .to.have.members([firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(x => x !== tokenId))
            .to.not.include(tokenId);
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
        await this.token.$_mint(this.owner, firstTokenId);
      });

      it('adjusts owner tokens by index', async function () {
        expect(await this.token.tokenOfOwnerByIndex(this.owner, 0n)).to.equal(firstTokenId);
      });

      it('adjusts all tokens list', async function () {
        expect(await this.token.tokenByIndex(0n)).to.equal(firstTokenId);
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
      });

      describe('with burnt token', function () {
        beforeEach(async function () {
          await this.token.$_burn(firstTokenId);
        });

        it('removes that token from the token list of the owner', async function () {
          expect(await this.token.tokenOfOwnerByIndex(this.owner, 0n)).to.equal(secondTokenId);
        });

        it('adjusts all tokens list', async function () {
          expect(await this.token.tokenByIndex(0n)).to.equal(secondTokenId);
        });

        it('burns all tokens', async function () {
          await this.token.$_burn(secondTokenId);
          expect(await this.token.totalSupply()).to.equal(0n);

          await expect(this.token.tokenByIndex(0n))
            .to.be.revertedWithCustomError(this.token, 'ERC721OutOfBoundsIndex')
            .withArgs(ethers.ZeroAddress, 0n);
        });
      });
    });
  });
}

function shouldBehaveLikeERC721Metadata(name, symbol) {
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

      describe('base URI', function () {
        beforeEach(function () {
          if (!this.token.interface.hasFunction('setBaseURI')) {
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
