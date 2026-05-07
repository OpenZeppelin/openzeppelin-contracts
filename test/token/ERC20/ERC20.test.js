const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');
const time = require('../../helpers/time');

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
} = require('./ERC20.behavior');

const TOKENS = [{ Token: '$ERC20' }, { Token: '$ERC20ApprovalMock', forcedApproval: true }];

const name = 'My Token';
const symbol = 'MTKN';
const initialSupply = 100n;

describe('ERC20', function () {
  for (const { Token, forcedApproval } of TOKENS) {
    describe(Token, function () {
      const fixture = async () => {
        // this.accounts is used by shouldBehaveLikeERC20
        const accounts = await ethers.getSigners();
        const [holder, recipient] = accounts;

        const token = await ethers.deployContract(Token, [name, symbol]);
        await token.$_mint(holder, initialSupply);

        return { accounts, holder, recipient, token };
      };

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      shouldBehaveLikeERC20(initialSupply, { forcedApproval });

      it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
      });

      it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
      });

      it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.equal(18n);
      });

      describe('ERC8255 expiring approvals', function () {
        it('sets the default expiration on approve', async function () {
          const tx = await this.token.connect(this.holder).approve(this.recipient, 42n);
          const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

          await expect(this.token.maxApprovalDuration()).to.eventually.equal(2n ** 32n - 1n);
          await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
            timestamp + 2n ** 32n - 1n,
            42n,
          ]);
        });

        it('sets a custom expiration on the approve overload', async function () {
          const duration = 3600n;
          const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
          const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

          await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
            timestamp + duration,
            42n,
          ]);
        });

        it('rejects durations above maxApprovalDuration', async function () {
          const token = await ethers.deployContract('$ERC20ExpiringApprovalMock', [name, symbol]);

          await expect(token.connect(this.holder).approveForDuration(this.recipient, 42n, 3601n))
            .to.be.revertedWithCustomError(token, 'ERC8255InvalidApprovalDuration')
            .withArgs(3601n, 3600n);
        });

        it('returns zero effective allowance and stored allowance data when the approval expires', async function () {
          const duration = 3600n;
          const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
          const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

          await time.increaseTo.timestamp(timestamp + duration + 1n);

          await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(0n);
          await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
            timestamp + duration,
            42n,
          ]);
          await expect(this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 1n))
            .to.be.revertedWithCustomError(this.token, 'ERC8255ExpiredApproval')
            .withArgs(this.recipient, timestamp + duration);
        });

        it('allows zero-duration approvals within the same transaction', async function () {
          const spender = await ethers.deployContract('$Address');
          const batch = await ethers.deployContract('BatchCaller');
          const value = 42n;

          await this.token.connect(this.holder).transfer(batch, value);

          await expect(
            batch.execute([
              {
                target: this.token,
                value: 0n,
                data: this.token.interface.encodeFunctionData('approveForDuration', [spender.target, value, 0n]),
              },
              {
                target: spender,
                value: 0n,
                data: spender.interface.encodeFunctionData('$functionCall', [
                  this.token.target,
                  this.token.interface.encodeFunctionData('transferFrom', [
                    batch.target,
                    this.recipient.address,
                    value,
                  ]),
                ]),
              },
            ]),
          ).to.changeTokenBalances(this.token, [batch, this.recipient], [-value, value]);
        });

        it('preserves expiration when transferFrom spends part of the allowance', async function () {
          const duration = 3600n;
          const tx = await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, duration);
          const timestamp = await time.clockFromReceipt.timestamp(tx.wait());

          await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 17n);

          await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
            timestamp + duration,
            25n,
          ]);
        });

        it('clears expiration when the allowance is fully spent', async function () {
          await this.token.connect(this.holder).approveForDuration(this.recipient, 42n, 3600n);

          await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 42n);

          await expect(this.token.allowanceAndExpiration(this.holder, this.recipient)).to.eventually.deep.equal([
            0n,
            0n,
          ]);
        });

        it('supports max uint256 as an allowance sentinel', async function () {
          await this.token.connect(this.holder).approve(this.recipient, ethers.MaxUint256);

          await this.token.connect(this.recipient).transferFrom(this.holder, this.recipient, 1n);

          await expect(this.token.allowance(this.holder, this.recipient)).to.eventually.equal(ethers.MaxUint256);
        });

        it('rejects values that cannot be represented in packed allowance storage', async function () {
          const unsupported = 2n ** 192n - 1n;
          await expect(this.token.connect(this.holder).approve(this.recipient, unsupported))
            .to.be.revertedWithCustomError(this.token, 'ERC8255InvalidApprovalValue')
            .withArgs(unsupported);
        });
      });

      describe('_mint', function () {
        const value = 50n;
        it('rejects a null account', async function () {
          await expect(this.token.$_mint(ethers.ZeroAddress, value))
            .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
            .withArgs(ethers.ZeroAddress);
        });

        it('rejects overflow', async function () {
          await expect(this.token.$_mint(this.recipient, ethers.MaxUint256)).to.be.revertedWithPanic(
            PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
          );
        });

        describe('for a non zero account', function () {
          beforeEach('minting', async function () {
            this.tx = await this.token.$_mint(this.recipient, value);
          });

          it('increments totalSupply', async function () {
            await expect(await this.token.totalSupply()).to.equal(initialSupply + value);
          });

          it('increments recipient balance', async function () {
            await expect(this.tx).to.changeTokenBalance(this.token, this.recipient, value);
          });

          it('emits Transfer event', async function () {
            await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, this.recipient, value);
          });
        });
      });

      describe('_burn', function () {
        it('rejects a null account', async function () {
          await expect(this.token.$_burn(ethers.ZeroAddress, 1n))
            .to.be.revertedWithCustomError(this.token, 'ERC20InvalidSender')
            .withArgs(ethers.ZeroAddress);
        });

        describe('for a non zero account', function () {
          it('rejects burning more than balance', async function () {
            await expect(this.token.$_burn(this.holder, initialSupply + 1n))
              .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
              .withArgs(this.holder, initialSupply, initialSupply + 1n);
          });

          const describeBurn = function (description, value) {
            describe(description, function () {
              beforeEach('burning', async function () {
                this.tx = await this.token.$_burn(this.holder, value);
              });

              it('decrements totalSupply', async function () {
                expect(await this.token.totalSupply()).to.equal(initialSupply - value);
              });

              it('decrements holder balance', async function () {
                await expect(this.tx).to.changeTokenBalance(this.token, this.holder, -value);
              });

              it('emits Transfer event', async function () {
                await expect(this.tx).to.emit(this.token, 'Transfer').withArgs(this.holder, ethers.ZeroAddress, value);
              });
            });
          };

          describeBurn('for entire balance', initialSupply);
          describeBurn('for less value than balance', initialSupply - 1n);
        });
      });

      describe('_update', function () {
        const value = 1n;

        beforeEach(async function () {
          this.totalSupply = await this.token.totalSupply();
        });

        it('from is the zero address', async function () {
          const tx = await this.token.$_update(ethers.ZeroAddress, this.holder, value);
          await expect(tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, this.holder, value);

          expect(await this.token.totalSupply()).to.equal(this.totalSupply + value);
          await expect(tx).to.changeTokenBalance(this.token, this.holder, value);
        });

        it('to is the zero address', async function () {
          const tx = await this.token.$_update(this.holder, ethers.ZeroAddress, value);
          await expect(tx).to.emit(this.token, 'Transfer').withArgs(this.holder, ethers.ZeroAddress, value);

          expect(await this.token.totalSupply()).to.equal(this.totalSupply - value);
          await expect(tx).to.changeTokenBalance(this.token, this.holder, -value);
        });

        describe('from and to are the same address', function () {
          it('zero address', async function () {
            const tx = await this.token.$_update(ethers.ZeroAddress, ethers.ZeroAddress, value);
            await expect(tx).to.emit(this.token, 'Transfer').withArgs(ethers.ZeroAddress, ethers.ZeroAddress, value);

            expect(await this.token.totalSupply()).to.equal(this.totalSupply);
            await expect(tx).to.changeTokenBalance(this.token, ethers.ZeroAddress, 0n);
          });

          describe('non zero address', function () {
            it('reverts without balance', async function () {
              await expect(this.token.$_update(this.recipient, this.recipient, value))
                .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
                .withArgs(this.recipient, 0n, value);
            });

            it('executes with balance', async function () {
              const tx = await this.token.$_update(this.holder, this.holder, value);
              await expect(tx).to.changeTokenBalance(this.token, this.holder, 0n);
              await expect(tx).to.emit(this.token, 'Transfer').withArgs(this.holder, this.holder, value);
            });
          });
        });
      });

      describe('_transfer', function () {
        beforeEach(function () {
          this.transfer = this.token.$_transfer;
        });

        shouldBehaveLikeERC20Transfer(initialSupply);

        it('reverts when the sender is the zero address', async function () {
          await expect(this.token.$_transfer(ethers.ZeroAddress, this.recipient, initialSupply))
            .to.be.revertedWithCustomError(this.token, 'ERC20InvalidSender')
            .withArgs(ethers.ZeroAddress);
        });
      });

      describe('_approve', function () {
        beforeEach(function () {
          this.approve = this.token.$_approve;
        });

        shouldBehaveLikeERC20Approve(initialSupply);

        it('reverts when the owner is the zero address', async function () {
          await expect(this.token.$_approve(ethers.ZeroAddress, this.recipient, initialSupply))
            .to.be.revertedWithCustomError(this.token, 'ERC20InvalidApprover')
            .withArgs(ethers.ZeroAddress);
        });
      });
    });
  }
});
