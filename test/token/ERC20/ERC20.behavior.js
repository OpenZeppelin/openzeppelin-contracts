const { ethers } = require('hardhat');
const { expect } = require('chai');

const { BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS, MAX_UINT256 } = constants;

const { expectRevertCustomError } = require('../../helpers/customError');

function shouldBehaveLikeERC20(initialSupply, accounts, opts = {}) {
  const [initialHolder, recipient, anotherAccount] = accounts;
  const { forcedApproval } = opts;

  describe('total supply', function () {
    it('returns the total token value', async function () {
      expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(0n);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total token value', async function () {
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialSupply);
      });
    });
  });

  describe('transfer', function () {
    shouldBehaveLikeERC20Transfer(initialHolder, recipient, initialSupply, function (from, to, value) {
      return this.token.transfer(to, value, { from });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the token owner is not the zero address', function () {
      const tokenOwner = initialHolder;

      describe('when the recipient is not the zero address', function () {
        const to = anotherAccount;

        describe('when the spender has enough allowance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, initialSupply, { from: initialHolder });
          });

          describe('when the token owner has enough balance', function () {
            const value = initialSupply;

            it('transfers the requested value', async function () {
              await this.token.transferFrom(tokenOwner, to, value, { from: spender });

              expect(await this.token.balanceOf(tokenOwner)).to.be.bignumber.equal(0n);

              expect(await this.token.balanceOf(to)).to.be.bignumber.equal(value);
            });

            it('decreases the spender allowance', async function () {
              await this.token.transferFrom(tokenOwner, to, value, { from: spender });

              expect(await this.token.allowance(tokenOwner, spender)).to.be.bignumber.equal(0n);
            });

            it('emits a transfer event', async function () {
              expectEvent(await this.token.transferFrom(tokenOwner, to, value, { from: spender }), 'Transfer', {
                from: tokenOwner,
                to: to,
                value: value,
              });
            });

            if (forcedApproval) {
              it('emits an approval event', async function () {
                expectEvent(await this.token.transferFrom(tokenOwner, to, value, { from: spender }), 'Approval', {
                  owner: tokenOwner,
                  spender: spender,
                  value: await this.token.allowance(tokenOwner, spender),
                });
              });
            } else {
              it('does not emit an approval event', async function () {
                expectEvent.notEmitted(
                  await this.token.transferFrom(tokenOwner, to, value, { from: spender }),
                  'Approval',
                );
              });
            }
          });

          describe('when the token owner does not have enough balance', function () {
            const value = initialSupply;

            beforeEach('reducing balance', async function () {
              await this.token.transfer(to, 1, { from: tokenOwner });
            });

            it('reverts', async function () {
              await expectRevertCustomError(
                this.token.transferFrom(tokenOwner, to, value, { from: spender }),
                'ERC20InsufficientBalance',
                [tokenOwner, value - 1, value],
              );
            });
          });
        });

        describe('when the spender does not have enough allowance', function () {
          const allowance = initialSupply.subn(1);

          beforeEach(async function () {
            await this.token.approve(spender, allowance, { from: tokenOwner });
          });

          describe('when the token owner has enough balance', function () {
            const value = initialSupply;

            it('reverts', async function () {
              await expectRevertCustomError(
                this.token.transferFrom(tokenOwner, to, value, { from: spender }),
                'ERC20InsufficientAllowance',
                [spender, allowance, value],
              );
            });
          });

          describe('when the token owner does not have enough balance', function () {
            const value = allowance;

            beforeEach('reducing balance', async function () {
              await this.token.transfer(to, 2, { from: tokenOwner });
            });

            it('reverts', async function () {
              await expectRevertCustomError(
                this.token.transferFrom(tokenOwner, to, value, { from: spender }),
                'ERC20InsufficientBalance',
                [tokenOwner, value - 1, value],
              );
            });
          });
        });

        describe('when the spender has unlimited allowance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, MAX_UINT256, { from: initialHolder });
          });

          it('does not decrease the spender allowance', async function () {
            await this.token.transferFrom(tokenOwner, to, 1, { from: spender });

            expect(await this.token.allowance(tokenOwner, spender)).to.be.bignumber.equal(MAX_UINT256);
          });

          it('does not emit an approval event', async function () {
            expectEvent.notEmitted(await this.token.transferFrom(tokenOwner, to, 1, { from: spender }), 'Approval');
          });
        });
      });

      describe('when the recipient is the zero address', function () {
        const value = initialSupply;
        const to = ZERO_ADDRESS;

        beforeEach(async function () {
          await this.token.approve(spender, value, { from: tokenOwner });
        });

        it('reverts', async function () {
          await expectRevertCustomError(
            this.token.transferFrom(tokenOwner, to, value, { from: spender }),
            'ERC20InvalidReceiver',
            [ZERO_ADDRESS],
          );
        });
      });
    });

    describe('when the token owner is the zero address', function () {
      const value = 0;
      const tokenOwner = ZERO_ADDRESS;
      const to = recipient;

      it('reverts', async function () {
        await expectRevertCustomError(
          this.token.transferFrom(tokenOwner, to, value, { from: spender }),
          'ERC20InvalidApprover',
          [ZERO_ADDRESS],
        );
      });
    });
  });

  describe('approve', function () {
    shouldBehaveLikeERC20Approve(initialHolder, recipient, initialSupply, function (owner, spender, value) {
      return this.token.approve(spender, value, { from: owner });
    });
  });
}

function shouldBehaveLikeERC20Transfer(from, to, balance, transfer) {
  describe('when the recipient is not the zero address', function () {
    describe('when the sender does not have enough balance', function () {
      const value = balance.addn(1);

      it('reverts', async function () {
        await expectRevertCustomError(transfer.call(this, from, to, value), 'ERC20InsufficientBalance', [
          from,
          balance,
          value,
        ]);
      });
    });

    describe('when the sender transfers all balance', function () {
      const value = balance;

      it('transfers the requested value', async function () {
        await transfer.call(this, from, to, value);

        expect(await this.token.balanceOf(from)).to.be.bignumber.equal(0n);

        expect(await this.token.balanceOf(to)).to.be.bignumber.equal(value);
      });

      it('emits a transfer event', async function () {
        expectEvent(await transfer.call(this, from, to, value), 'Transfer', { from, to, value: value });
      });
    });

    describe('when the sender transfers zero tokens', function () {
      const value = new BN(0n);

      it('transfers the requested value', async function () {
        await transfer.call(this, from, to, value);

        expect(await this.token.balanceOf(from)).to.be.bignumber.equal(balance);

        expect(await this.token.balanceOf(to)).to.be.bignumber.equal(0n);
      });

      it('emits a transfer event', async function () {
        expectEvent(await transfer.call(this, from, to, value), 'Transfer', { from, to, value: value });
      });
    });
  });

  describe('when the recipient is the zero address', function () {
    it('reverts', async function () {
      await expectRevertCustomError(transfer.call(this, from, ZERO_ADDRESS, balance), 'ERC20InvalidReceiver', [
        ZERO_ADDRESS,
      ]);
    });
  });
}

function shouldBehaveLikeERC20Approve(owner, spender, supply, approve) {
  describe('when the spender is not the zero address', function () {
    describe('when the sender has enough balance', function () {
      const value = supply;

      it('emits an approval event', async function () {
        expectEvent(await approve.call(this, owner, spender, value), 'Approval', {
          owner: owner,
          spender: spender,
          value: value,
        });
      });

      describe('when there was no approved value before', function () {
        it('approves the requested value', async function () {
          await approve.call(this, owner, spender, value);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
        });
      });

      describe('when the spender had an approved value', function () {
        beforeEach(async function () {
          await approve.call(this, owner, spender, new BN(1));
        });

        it('approves the requested value and replaces the previous one', async function () {
          await approve.call(this, owner, spender, value);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
        });
      });
    });

    describe('when the sender does not have enough balance', function () {
      const value = supply.addn(1);

      it('emits an approval event', async function () {
        expectEvent(await approve.call(this, owner, spender, value), 'Approval', {
          owner: owner,
          spender: spender,
          value: value,
        });
      });

      describe('when there was no approved value before', function () {
        it('approves the requested value', async function () {
          await approve.call(this, owner, spender, value);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
        });
      });

      describe('when the spender had an approved value', function () {
        beforeEach(async function () {
          await approve.call(this, owner, spender, new BN(1));
        });

        it('approves the requested value and replaces the previous one', async function () {
          await approve.call(this, owner, spender, value);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
        });
      });
    });
  });

  describe('when the spender is the zero address', function () {
    it('reverts', async function () {
      await expectRevertCustomError(approve.call(this, owner, ZERO_ADDRESS, supply), `ERC20InvalidSpender`, [
        ZERO_ADDRESS,
      ]);
    });
  });
}

function shouldBehaveLikeERC20Bigint(initialSupply, opts = {}) {
  const { forcedApproval } = opts;

  it('total supply: returns the total token value', async function () {
    expect(await this.token.totalSupply()).to.equal(initialSupply);
  });

  describe('balanceOf', function () {
    it('returns zero when the requested account has no tokens', async function () {
      expect(await this.token.balanceOf(this.anotherAccount)).to.equal(0n);
    });

    it('returns the total token value when the requested account has some tokens', async function () {
      expect(await this.token.balanceOf(this.initialHolder)).to.equal(initialSupply);
    });
  });

  describe('transfer', function () {
    beforeEach(function () {
      this.transfer = (from, to, value) => this.token.connect(from).transfer(to, value);
    });

    shouldBehaveLikeERC20TransferBigint(initialSupply);
  });

  describe('transfer from', function () {
    describe('when the token owner is not the zero address', function () {
      describe('when the recipient is not the zero address', function () {
        describe('when the spender has enough allowance', function () {
          beforeEach(async function () {
            await this.token.connect(this.initialHolder).approve(this.recipient, initialSupply);
          });

          describe('when the token owner has enough balance', function () {
            const value = initialSupply;

            beforeEach(async function () {
              this.tx = await this.token
                .connect(this.recipient)
                .transferFrom(this.initialHolder, this.anotherAccount, value);
            });

            it('transfers the requested value', async function () {
              expect(await this.token.balanceOf(this.initialHolder)).to.equal(0n);
              expect(await this.token.balanceOf(this.anotherAccount)).to.equal(value);
            });

            it('decreases the spender allowance', async function () {
              expect(await this.token.allowance(this.initialHolder, this.recipient)).to.equal(0n);
            });

            it('emits a transfer event', async function () {
              await expect(this.tx)
                .to.emit(this.token, 'Transfer')
                .withArgs(this.initialHolder.address, this.anotherAccount.address, value);
            });

            if (forcedApproval) {
              it('emits an approval event', async function () {
                await expect(this.tx)
                  .to.emit(this.token, 'Approval')
                  .withArgs(
                    this.initialHolder.address,
                    this.recipient.address,
                    await this.token.allowance(this.initialHolder, this.recipient),
                  );
              });
            } else {
              it('does not emit an approval event', async function () {
                await expect(this.tx).to.not.emit(this.token, 'Approval');
              });
            }
          });

          it('reverts when the token owner does not have enough balance', async function () {
            const value = initialSupply;
            await this.token.connect(this.initialHolder).transfer(this.anotherAccount, 1n);
            await expect(
              this.token.connect(this.recipient).transferFrom(this.initialHolder, this.anotherAccount, value),
            )
              .to.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
              .withArgs(this.initialHolder.address, value - 1n, value);
          });
        });

        describe('when the spender does not have enough allowance', function () {
          const allowance = initialSupply - 1n;

          beforeEach(async function () {
            await this.token.connect(this.initialHolder).approve(this.recipient, allowance);
          });

          it('reverts when the token owner has enough balance', async function () {
            const value = initialSupply;
            await expect(
              this.token.connect(this.recipient).transferFrom(this.initialHolder, this.anotherAccount, value),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientAllowance')
              .withArgs(this.recipient.address, allowance, value);
          });

          it('reverts when the token owner does not have enougth balance', async function () {
            const value = allowance;
            await this.token.connect(this.initialHolder).transfer(this.anotherAccount, 2);
            await expect(
              this.token.connect(this.recipient).transferFrom(this.initialHolder, this.anotherAccount, value),
            )
              .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
              .withArgs(this.initialHolder.address, value - 1n, value);
          });
        });

        describe('when the spender has unlimited allowance', function () {
          beforeEach(async function () {
            await this.token.connect(this.initialHolder).approve(this.recipient, ethers.MaxUint256);
            this.tx = await this.token
              .connect(this.recipient)
              .transferFrom(this.initialHolder, this.anotherAccount, 1n);
          });

          it('does not decrease the spender allowance', async function () {
            expect(await this.token.allowance(this.initialHolder, this.recipient)).to.equal(ethers.MaxUint256);
          });

          it('does not emit an approval event', async function () {
            await expect(this.tx).to.not.emit(this.token, 'Approval');
          });
        });
      });

      it('reverts when the recipient is the zero address', async function () {
        const value = initialSupply;
        await this.token.connect(this.initialHolder).approve(this.recipient, value);
        await expect(this.token.connect(this.recipient).transferFrom(this.initialHolder, ethers.ZeroAddress, value))
          .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
          .withArgs(ethers.ZeroAddress);
      });
    });

    it('reverts when the token owner is the zero address', async function () {
      const value = 0n;
      await expect(this.token.connect(this.recipient).transferFrom(ethers.ZeroAddress, this.recipient, value))
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidApprover')
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe('approve', function () {
    beforeEach(function () {
      this.approve = (owner, spender, value) => this.token.connect(owner).approve(spender, value);
    });

    shouldBehaveLikeERC20ApproveBigint(initialSupply);
  });
}

function shouldBehaveLikeERC20TransferBigint(balance) {
  describe('when the recipient is not the zero address', function () {
    it('reverts when the sender does not have enough balance', async function () {
      const value = balance + 1n;
      await expect(this.transfer(this.initialHolder, this.recipient, value))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
        .withArgs(this.initialHolder.address, balance, value);
    });

    describe('when the sender transfers all balance', function () {
      const value = balance;

      beforeEach(async function () {
        this.tx = await this.transfer(this.initialHolder, this.recipient, value);
      });

      it('transfers the requested value', async function () {
        expect(await this.token.balanceOf(this.initialHolder)).to.equal(0n);
        expect(await this.token.balanceOf(this.recipient)).to.equal(value);
      });

      it('emits a transfer event', async function () {
        await expect(this.tx)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.initialHolder.address, this.recipient.address, value);
      });
    });

    describe('when the sender transfers zero tokens', function () {
      const value = 0n;

      beforeEach(async function () {
        this.tx = await this.transfer(this.initialHolder, this.recipient, value);
      });

      it('transfers the requested value', async function () {
        expect(await this.token.balanceOf(this.initialHolder)).to.equal(balance);
        expect(await this.token.balanceOf(this.recipient)).to.equal(0n);
      });

      it('emits a transfer event', async function () {
        await expect(this.tx)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.initialHolder.address, this.recipient.address, value);
      });
    });
  });

  it('reverts when the recipient is the zero address', async function () {
    await expect(this.transfer(this.initialHolder, ethers.ZeroAddress, balance))
      .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
      .withArgs(ethers.ZeroAddress);
  });
}

function shouldBehaveLikeERC20ApproveBigint(supply) {
  describe('when the spender is not the zero address', function () {
    describe('when the sender has enough balance', function () {
      const value = supply;

      it('emits an approval event', async function () {
        await expect(this.approve(this.initialHolder, this.recipient, value))
          .to.emit(this.token, 'Approval')
          .withArgs(this.initialHolder.address, this.recipient.address, value);
      });

      it('approves the requested value when there was no approved value before', async function () {
        await this.approve(this.initialHolder, this.recipient, value);

        expect(await this.token.allowance(this.initialHolder, this.recipient)).to.equal(value);
      });

      it('approves the requested value and replaces the previous one when the spender had an approved value', async function () {
        await this.approve(this.initialHolder, this.recipient, 1n);
        await this.approve(this.initialHolder, this.recipient, value);

        expect(await this.token.allowance(this.initialHolder, this.recipient)).to.equal(value);
      });
    });

    describe('when the sender does not have enough balance', function () {
      const value = supply + 1n;

      it('emits an approval event', async function () {
        await expect(this.approve(this.initialHolder, this.recipient, value))
          .to.emit(this.token, 'Approval')
          .withArgs(this.initialHolder.address, this.recipient.address, value);
      });

      it('approves the requested value when there was no approved value before', async function () {
        await this.approve(this.initialHolder, this.recipient, value);

        expect(await this.token.allowance(this.initialHolder, this.recipient)).to.equal(value);
      });

      it('approves the requested value and replaces the previous one when the spender had an approved value', async function () {
        await this.approve(this.initialHolder, this.recipient, 1n);
        await this.approve(this.initialHolder, this.recipient, value);

        expect(await this.token.allowance(this.initialHolder, this.recipient)).to.equal(value);
      });
    });
  });

  it('reverts when the spender is the zero address', async function () {
    await expect(this.approve(this.initialHolder, ethers.ZeroAddress, supply))
      .to.be.revertedWithCustomError(this.token, `ERC20InvalidSpender`)
      .withArgs(ethers.ZeroAddress);
  });
}

module.exports = {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
  bigint: {
    shouldBehaveLikeERC20: shouldBehaveLikeERC20Bigint,
    shouldBehaveLikeERC20Transfer: shouldBehaveLikeERC20TransferBigint,
    shouldBehaveLikeERC20Approve: shouldBehaveLikeERC20ApproveBigint,
  },
};
