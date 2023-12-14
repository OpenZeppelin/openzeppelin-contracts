const { ethers } = require('hardhat');
const { expect } = require('chai');

function shouldBehaveLikeERC20(initialSupply, opts = {}) {
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

    shouldBehaveLikeERC20Transfer(initialSupply);
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
              await expect(this.tx).to.changeTokenBalances(
                this.token,
                [this.initialHolder, this.anotherAccount],
                [-value, value],
              );
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

          it('reverts when the token owner does not have enough balance', async function () {
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

    shouldBehaveLikeERC20Approve(initialSupply);
  });
}

function shouldBehaveLikeERC20Transfer(balance) {
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
        await expect(this.tx).to.changeTokenBalances(this.token, [this.initialHolder, this.recipient], [-value, value]);
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
        await expect(this.tx).to.changeTokenBalances(this.token, [this.initialHolder, this.recipient], [0n, 0n]);
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

function shouldBehaveLikeERC20Approve(supply) {
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
};
