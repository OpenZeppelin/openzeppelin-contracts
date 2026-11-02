import { ethers } from 'ethers';
import { expect } from 'chai';

function shouldBehaveLikeERC4626Deposit({ initialAssets, initialShares, balance, isERC7540 } = {}) {
  initialAssets ??= ethers.parseEther('17000000');
  initialShares ??= ethers.parseEther('42000000');
  balance ??= ethers.parseEther('1000');
  isERC7540 ??= false;

  describe('Should behave like ERC4626 deposit', function () {
    before(async function () {
      [this.owner, this.controller, this.receiver, this.operator, this.other] = await this.ethers.getSigners();
    });

    beforeEach(async function () {
      await this.token.$_mint(this.mock, initialAssets);
      await this.mock.$_mint(this.owner, initialShares);

      await this.token.$_mint(this.owner, balance);
      await this.token.connect(this.owner).approve(this.mock, ethers.MaxUint256);
    });

    isERC7540 &&
      describe('Disabled ERC7540 deposit functions', function () {
        it('requestDeposit', async function () {
          await expect(
            this.mock.connect(this.owner).requestDeposit(0n, this.owner, this.owner),
          ).to.be.revertedWithCustomError(this.mock, 'ERC7540SyncDeposit');
        });

        it('pendingDepositRequest', async function () {
          await expect(this.mock.pendingDepositRequest(0n, this.owner)).to.eventually.equal(0n);
        });

        it('claimableDepositRequest', async function () {
          await expect(this.mock.claimableDepositRequest(0n, this.owner)).to.eventually.equal(0n);
        });

        describe('Internal async deposit hooks revert', function () {
          it('_pendingDepositRequest', async function () {
            await expect(this.mock.$_pendingDepositRequest(0n, this.owner)).to.revert(this.ethers);
          });

          it('_claimableDepositRequest', async function () {
            await expect(this.mock.$_claimableDepositRequest(0n, this.owner)).to.revert(this.ethers);
          });

          it('_consumeClaimableDeposit', async function () {
            await expect(this.mock.$_consumeClaimableDeposit(0n, this.owner)).to.revert(this.ethers);
          });

          it('_consumeClaimableMint', async function () {
            await expect(this.mock.$_consumeClaimableMint(0n, this.owner)).to.revert(this.ethers);
          });

          it('_asyncMaxDeposit', async function () {
            await expect(this.mock.$_asyncMaxDeposit(this.owner)).to.revert(this.ethers);
          });

          it('_asyncMaxMint', async function () {
            await expect(this.mock.$_asyncMaxMint(this.owner)).to.revert(this.ethers);
          });
        });
      });

    describe('Synchronous operation ', function () {
      const assets = ethers.parseEther('100');

      it('previewDeposit', async function () {
        await expect(this.mock.previewDeposit(0n)).to.not.revert(this.ethers);
      });

      it('previewMint', async function () {
        await expect(this.mock.previewMint(0n)).to.not.revert(this.ethers);
      });

      describe('deposit', function () {
        it('deposits assets and mints shares to receiver', async function () {
          const shares = await this.mock.previewDeposit(assets);

          const tx = this.mock.connect(this.owner).deposit(assets, this.receiver);

          await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.owner, this.receiver, assets, shares);
          await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.owner, this.mock], [-assets, assets]);
          await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, shares);
        });

        it('maxDeposit returns unlimited', async function () {
          await expect(this.mock.maxDeposit(this.owner)).to.eventually.equal(ethers.MaxUint256);
        });
      });

      describe('mint', function () {
        it('mints exact shares and transfers assets', async function () {
          const shares = ethers.parseEther('100');
          const requiredAssets = await this.mock.previewMint(shares);

          const tx = this.mock.connect(this.owner).mint(shares, this.receiver);

          await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.owner, this.receiver, requiredAssets, shares);
          await expect(tx).to.changeTokenBalances(
            this.ethers,
            this.token,
            [this.owner, this.mock],
            [-requiredAssets, requiredAssets],
          );
          await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, shares);
        });

        it('maxMint returns unlimited', async function () {
          await expect(this.mock.maxMint(this.owner)).to.eventually.equal(ethers.MaxUint256);
        });
      });
    });
  });
}

function shouldBehaveLikeERC4626Redeem({ initialAssets, initialShares, balance, isERC7540 } = {}) {
  initialAssets ??= ethers.parseEther('17000000');
  initialShares ??= ethers.parseEther('42000000');
  balance ??= ethers.parseEther('1000');
  isERC7540 ??= false;

  describe('Should behave like ERC4626 redeem', function () {
    before(async function () {
      [this.owner, this.controller, this.receiver, this.operator, this.other] = await this.ethers.getSigners();
    });

    beforeEach(async function () {
      await this.token.$_mint(this.mock, initialAssets);
      await this.mock.$_mint(this.owner, initialShares);

      await this.token.$_mint(this.owner, balance);
      await this.token.connect(this.owner).approve(this.mock, ethers.MaxUint256);
    });

    isERC7540 &&
      describe('Disabled ERC7540 redeem functions', function () {
        it('requestRedeem', async function () {
          await expect(
            this.mock.connect(this.owner).requestRedeem(0n, this.owner, this.owner),
          ).to.be.revertedWithCustomError(this.mock, 'ERC7540SyncRedeem');
        });

        it('pendingRedeemRequest', async function () {
          await expect(this.mock.pendingRedeemRequest(0n, this.owner)).to.eventually.equal(0n);
        });

        it('claimableRedeemRequest', async function () {
          await expect(this.mock.claimableRedeemRequest(0n, this.owner)).to.eventually.equal(0n);
        });

        describe('Internal async redeem hooks revert', function () {
          it('_pendingRedeemRequest', async function () {
            await expect(this.mock.$_pendingRedeemRequest(0n, this.owner)).to.revert(this.ethers);
          });

          it('_claimableRedeemRequest', async function () {
            await expect(this.mock.$_claimableRedeemRequest(0n, this.owner)).to.revert(this.ethers);
          });

          it('_consumeClaimableWithdraw', async function () {
            await expect(this.mock.$_consumeClaimableWithdraw(0n, this.owner)).to.revert(this.ethers);
          });

          it('_consumeClaimableRedeem', async function () {
            await expect(this.mock.$_consumeClaimableRedeem(0n, this.owner)).to.revert(this.ethers);
          });

          it('_asyncMaxWithdraw', async function () {
            await expect(this.mock.$_asyncMaxWithdraw(this.owner)).to.revert(this.ethers);
          });

          it('_asyncMaxRedeem', async function () {
            await expect(this.mock.$_asyncMaxRedeem(this.owner)).to.revert(this.ethers);
          });
        });
      });

    describe('Synchronous operation ', function () {
      const shares = ethers.parseEther('100');

      it('previewWithdraw', async function () {
        await expect(this.mock.previewWithdraw(0n)).to.not.revert(this.ethers);
      });

      it('previewRedeem', async function () {
        await expect(this.mock.previewRedeem(0n)).to.not.revert(this.ethers);
      });

      describe('redeem', function () {
        it('redeems shares for assets', async function () {
          const assets = await this.mock.previewRedeem(shares);

          const tx = this.mock.connect(this.owner).redeem(shares, this.receiver, this.owner);

          await expect(tx)
            .to.emit(this.mock, 'Withdraw')
            .withArgs(this.owner, this.receiver, this.owner, assets, shares);
          await expect(tx).to.changeTokenBalances(
            this.ethers,
            this.token,
            [this.mock, this.receiver],
            [-assets, assets],
          );
          await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.owner, -shares);
        });

        it('allows spending allowance', async function () {
          const assets = await this.mock.previewRedeem(shares);
          await this.mock.connect(this.owner).approve(this.other, shares);

          const tx = this.mock.connect(this.other).redeem(shares, this.receiver, this.owner);

          await expect(tx)
            .to.emit(this.mock, 'Withdraw')
            .withArgs(this.other, this.receiver, this.owner, assets, shares);
          await expect(tx).to.changeTokenBalances(
            this.ethers,
            this.token,
            [this.mock, this.receiver],
            [-assets, assets],
          );
          await expect(this.mock.allowance(this.owner, this.other)).to.eventually.equal(0n);
        });

        it('reverts when caller has no allowance', async function () {
          await expect(this.mock.connect(this.other).redeem(shares, this.receiver, this.owner))
            .to.be.revertedWithCustomError(this.mock, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, shares);
        });

        it('reverts when redeeming more than balance', async function () {
          const ownerBalance = await this.mock.balanceOf(this.owner);
          const excess = ownerBalance + 1n;
          await expect(this.mock.connect(this.owner).redeem(excess, this.receiver, this.owner))
            .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxRedeem')
            .withArgs(this.owner, excess, ownerBalance);
        });

        it('maxRedeem returns share balance', async function () {
          const ownerBalance = await this.mock.balanceOf(this.owner);
          await expect(this.mock.maxRedeem(this.owner)).to.eventually.equal(ownerBalance);
        });
      });

      describe('withdraw', function () {
        it('withdraws exact assets', async function () {
          const assets = ethers.parseEther('100');
          const expectedShares = await this.mock.previewWithdraw(assets);

          const tx = this.mock.connect(this.owner).withdraw(assets, this.receiver, this.owner);

          await expect(tx)
            .to.emit(this.mock, 'Withdraw')
            .withArgs(this.owner, this.receiver, this.owner, assets, expectedShares);
          await expect(tx).to.changeTokenBalances(
            this.ethers,
            this.token,
            [this.mock, this.receiver],
            [-assets, assets],
          );
          await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.owner, -expectedShares);
        });

        it('allows spending allowance', async function () {
          const assets = ethers.parseEther('100');
          const expectedShares = await this.mock.previewWithdraw(assets);
          await this.mock.connect(this.owner).approve(this.other, expectedShares);

          const tx = this.mock.connect(this.other).withdraw(assets, this.receiver, this.owner);

          await expect(tx)
            .to.emit(this.mock, 'Withdraw')
            .withArgs(this.other, this.receiver, this.owner, assets, expectedShares);
          await expect(tx).to.changeTokenBalances(
            this.ethers,
            this.token,
            [this.mock, this.receiver],
            [-assets, assets],
          );
        });

        it('reverts when caller has no allowance', async function () {
          const assets = ethers.parseEther('100');
          const expectedShares = await this.mock.previewWithdraw(assets);
          await expect(this.mock.connect(this.other).withdraw(assets, this.receiver, this.owner))
            .to.be.revertedWithCustomError(this.mock, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, expectedShares);
        });

        it('maxWithdraw returns asset value of shares', async function () {
          const ownerBalance = await this.mock.balanceOf(this.owner);
          const expected = await this.mock.previewRedeem(ownerBalance);
          await expect(this.mock.maxWithdraw(this.owner)).to.eventually.equal(expected);
        });
      });
    });
  });
}

export { shouldBehaveLikeERC4626Deposit, shouldBehaveLikeERC4626Redeem };
