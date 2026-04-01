const { expect } = require('chai');

const REQUEST_ID = 0n;

function shouldBehaveLikeERC7540Deposit() {
  const depositAmount = 1000n;

  describe('like an ERC7540Deposit', function () {
    describe('previewDeposit', function () {
      it('always reverts', async function () {
        await expect(this.token.previewDeposit(depositAmount)).to.be.revertedWithCustomError(
          this.token,
          'ERC7540DepositPreviewNotAvailable',
        );
      });
    });

    describe('previewMint', function () {
      it('always reverts', async function () {
        await expect(this.token.previewMint(depositAmount)).to.be.revertedWithCustomError(
          this.token,
          'ERC7540DepositPreviewNotAvailable',
        );
      });
    });

    describe('initial state', function () {
      it('pendingDepositRequest returns 0', async function () {
        await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
      });

      it('claimableDepositRequest returns 0', async function () {
        await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
      });

      it('claimableDepositRequestShares returns 0', async function () {
        await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(0n);
      });

      it('maxDeposit returns 0', async function () {
        await expect(this.token.maxDeposit(this.holder)).to.eventually.equal(0n);
      });

      it('maxMint returns 0', async function () {
        await expect(this.token.maxMint(this.holder)).to.eventually.equal(0n);
      });
    });

    describe('totalAssets', function () {
      it('excludes pending deposit assets', async function () {
        await this.asset.$_mint(this.holder, depositAmount);
        await this.asset.connect(this.holder).approve(this.token, depositAmount);
        await this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder);

        await expect(this.asset.balanceOf(this.token)).to.eventually.equal(depositAmount);
        await expect(this.token.totalAssets()).to.eventually.equal(0n);
      });

      it('includes fulfilled (non-pending) assets', async function () {
        await this.asset.$_mint(this.holder, depositAmount);
        await this.asset.connect(this.holder).approve(this.token, depositAmount);
        await this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder);
        await this.token.$_fulfillDeposit(depositAmount, this.holder);

        await expect(this.token.totalAssets()).to.eventually.equal(depositAmount);
      });
    });

    describe('requestDeposit', function () {
      it('reverts when caller is not owner or operator of owner', async function () {
        await this.asset.$_mint(this.holder, depositAmount);
        await this.asset.connect(this.holder).approve(this.token, depositAmount);

        await expect(this.token.connect(this.other).requestDeposit(depositAmount, this.holder, this.holder))
          .to.be.revertedWithCustomError(this.token, 'ERC7540InvalidOperator')
          .withArgs(this.holder, this.other);
      });

      it('reverts when owner has insufficient asset balance', async function () {
        await this.asset.connect(this.holder).approve(this.token, depositAmount);

        await expect(
          this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder),
        ).to.be.revertedWithCustomError(this.asset, 'ERC20InsufficientBalance');
      });

      describe('with valid request', function () {
        beforeEach(async function () {
          await this.asset.$_mint(this.holder, depositAmount);
          await this.asset.connect(this.holder).approve(this.token, depositAmount);
          this.tx = await this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder);
        });

        it('emits a DepositRequest event', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'DepositRequest')
            .withArgs(this.holder, this.holder, REQUEST_ID, this.holder, depositAmount);
        });

        it('transfers assets from owner to vault', async function () {
          await expect(this.asset.balanceOf(this.holder)).to.eventually.equal(0n);
          await expect(this.asset.balanceOf(this.token)).to.eventually.equal(depositAmount);
        });

        it('updates pendingDepositRequest', async function () {
          await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(depositAmount);
        });

        it('accumulates on multiple requests', async function () {
          const extra = 500n;
          await this.asset.$_mint(this.holder, extra);
          await this.asset.connect(this.holder).approve(this.token, extra);
          await this.token.connect(this.holder).requestDeposit(extra, this.holder, this.holder);

          await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(
            depositAmount + extra,
          );
        });
      });

      describe('with operator', function () {
        it('operator can request on behalf of owner', async function () {
          await this.token.connect(this.holder).setOperator(this.operator, true);
          await this.asset.$_mint(this.holder, depositAmount);
          await this.asset.connect(this.holder).approve(this.token, depositAmount);

          await expect(this.token.connect(this.operator).requestDeposit(depositAmount, this.holder, this.holder))
            .to.emit(this.token, 'DepositRequest')
            .withArgs(this.holder, this.holder, REQUEST_ID, this.operator, depositAmount);
        });
      });
    });

    describe('_fulfillDeposit', function () {
      beforeEach(async function () {
        await this.asset.$_mint(this.holder, depositAmount);
        await this.asset.connect(this.holder).approve(this.token, depositAmount);
        await this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder);
      });

      it('reverts when fulfilling more than pending', async function () {
        await expect(this.token.$_fulfillDeposit(depositAmount + 1n, this.holder))
          .to.be.revertedWithCustomError(this.token, 'ERC7540DepositInsufficientPendingAssets')
          .withArgs(depositAmount + 1n, depositAmount);
      });

      describe('full fulfillment', function () {
        beforeEach(async function () {
          this.expectedShares = depositAmount; // 1:1 exchange rate in empty vault
          this.tx = await this.token.$_fulfillDeposit(depositAmount, this.holder);
        });

        it('emits DepositClaimable', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'DepositClaimable')
            .withArgs(this.holder, REQUEST_ID, depositAmount, this.expectedShares);
        });

        it('clears pending deposit', async function () {
          await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        });

        it('updates claimable deposit', async function () {
          await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(depositAmount);
          await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(
            this.expectedShares,
          );
        });

        it('updates maxDeposit and maxMint', async function () {
          await expect(this.token.maxDeposit(this.holder)).to.eventually.equal(depositAmount);
          await expect(this.token.maxMint(this.holder)).to.eventually.equal(this.expectedShares);
        });

        it('mints shares to the vault itself', async function () {
          await expect(this.token.balanceOf(this.token)).to.eventually.equal(this.expectedShares);
        });
      });

      describe('partial fulfillment', function () {
        const partialAmount = 400n;

        beforeEach(async function () {
          this.tx = await this.token.$_fulfillDeposit(partialAmount, this.holder);
        });

        it('emits DepositClaimable for the partial amount', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'DepositClaimable')
            .withArgs(this.holder, REQUEST_ID, partialAmount, partialAmount);
        });

        it('partially transitions pending to claimable', async function () {
          await expect(this.token.pendingDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(
            depositAmount - partialAmount,
          );
          await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(partialAmount);
        });
      });
    });

    describe('deposit (claim)', function () {
      beforeEach(async function () {
        await this.asset.$_mint(this.holder, depositAmount);
        await this.asset.connect(this.holder).approve(this.token, depositAmount);
        await this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder);
        await this.token.$_fulfillDeposit(depositAmount, this.holder);
        this.expectedShares = depositAmount; // 1:1 rate
      });

      describe('3-arg', function () {
        it('reverts when caller is not controller or operator', async function () {
          await expect(
            this.token
              .connect(this.other)
              ['deposit(uint256,address,address)'](depositAmount, this.recipient, this.holder),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC7540InvalidOperator')
            .withArgs(this.holder, this.other);
        });

        it('transfers shares to receiver and emits Deposit', async function () {
          const tx = await this.token
            .connect(this.holder)
            ['deposit(uint256,address,address)'](depositAmount, this.recipient, this.holder);

          await expect(tx)
            .to.emit(this.token, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAmount, this.expectedShares);

          await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(this.expectedShares);
        });

        it('clears claimable after full claim', async function () {
          await this.token
            .connect(this.holder)
            ['deposit(uint256,address,address)'](depositAmount, this.recipient, this.holder);

          await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
          await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(0n);
          await expect(this.token.maxDeposit(this.holder)).to.eventually.equal(0n);
        });

        it('can partially claim', async function () {
          const partialAssets = 400n;
          const partialShares = 400n; // 1:1

          await this.token
            .connect(this.holder)
            ['deposit(uint256,address,address)'](partialAssets, this.recipient, this.holder);

          await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(partialShares);
          await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(
            depositAmount - partialAssets,
          );
        });

        it('operator can claim on behalf of controller', async function () {
          await this.token.connect(this.holder).setOperator(this.operator, true);

          await expect(
            this.token
              .connect(this.operator)
              ['deposit(uint256,address,address)'](depositAmount, this.recipient, this.holder),
          )
            .to.emit(this.token, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAmount, this.expectedShares);
        });
      });

      describe('2-arg', function () {
        it('claims with receiver as controller', async function () {
          const tx = await this.token.connect(this.holder)['deposit(uint256,address)'](depositAmount, this.holder);

          await expect(tx)
            .to.emit(this.token, 'Deposit')
            .withArgs(this.holder, this.holder, depositAmount, this.expectedShares);

          await expect(this.token.balanceOf(this.holder)).to.eventually.equal(this.expectedShares);
        });
      });
    });

    describe('mint (claim)', function () {
      beforeEach(async function () {
        await this.asset.$_mint(this.holder, depositAmount);
        await this.asset.connect(this.holder).approve(this.token, depositAmount);
        await this.token.connect(this.holder).requestDeposit(depositAmount, this.holder, this.holder);
        await this.token.$_fulfillDeposit(depositAmount, this.holder);
        this.expectedShares = depositAmount; // 1:1 rate
      });

      describe('3-arg', function () {
        it('reverts when caller is not controller or operator', async function () {
          await expect(
            this.token
              .connect(this.other)
              ['mint(uint256,address,address)'](this.expectedShares, this.recipient, this.holder),
          )
            .to.be.revertedWithCustomError(this.token, 'ERC7540InvalidOperator')
            .withArgs(this.holder, this.other);
        });

        it('claims shares by amount and emits Deposit', async function () {
          const tx = await this.token
            .connect(this.holder)
            ['mint(uint256,address,address)'](this.expectedShares, this.recipient, this.holder);

          await expect(tx)
            .to.emit(this.token, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAmount, this.expectedShares);

          await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(this.expectedShares);
        });

        it('clears claimable after full claim', async function () {
          await this.token
            .connect(this.holder)
            ['mint(uint256,address,address)'](this.expectedShares, this.recipient, this.holder);

          await expect(this.token.claimableDepositRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
          await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        });

        it('can partially claim', async function () {
          const partialShares = 400n;

          await this.token
            .connect(this.holder)
            ['mint(uint256,address,address)'](partialShares, this.recipient, this.holder);

          await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(partialShares);
          await expect(this.token.claimableDepositRequestShares(REQUEST_ID, this.holder)).to.eventually.equal(
            this.expectedShares - partialShares,
          );
        });

        it('operator can claim on behalf of controller', async function () {
          await this.token.connect(this.holder).setOperator(this.operator, true);

          await expect(
            this.token
              .connect(this.operator)
              ['mint(uint256,address,address)'](this.expectedShares, this.recipient, this.holder),
          )
            .to.emit(this.token, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAmount, this.expectedShares);
        });
      });

      describe('2-arg', function () {
        it('claims with receiver as controller', async function () {
          const tx = await this.token.connect(this.holder)['mint(uint256,address)'](this.expectedShares, this.holder);

          await expect(tx)
            .to.emit(this.token, 'Deposit')
            .withArgs(this.holder, this.holder, depositAmount, this.expectedShares);

          await expect(this.token.balanceOf(this.holder)).to.eventually.equal(this.expectedShares);
        });
      });
    });
  });
}

function shouldBehaveLikeERC7540Redeem() {
  const shareAmount = 1000n;
  const assetAmount = 1000n; // 1:1 rate in setup

  describe('like an ERC7540Redeem', function () {
    describe('previewRedeem', function () {
      it('always reverts', async function () {
        await expect(this.token.previewRedeem(shareAmount)).to.be.revertedWithCustomError(
          this.token,
          'ERC7540RedeemPreviewNotAvailable',
        );
      });
    });

    describe('previewWithdraw', function () {
      it('always reverts', async function () {
        await expect(this.token.previewWithdraw(assetAmount)).to.be.revertedWithCustomError(
          this.token,
          'ERC7540RedeemPreviewNotAvailable',
        );
      });
    });

    describe('initial state', function () {
      it('pendingRedeemRequest returns 0', async function () {
        await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
      });

      it('claimableRedeemRequest returns 0', async function () {
        await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
      });

      it('claimableRedeemRequestAssets returns 0', async function () {
        await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(0n);
      });

      it('maxWithdraw returns 0', async function () {
        await expect(this.token.maxWithdraw(this.holder)).to.eventually.equal(0n);
      });

      it('maxRedeem returns 0', async function () {
        await expect(this.token.maxRedeem(this.holder)).to.eventually.equal(0n);
      });
    });

    describe('requestRedeem', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, shareAmount);
        await this.asset.$_mint(this.token, assetAmount);
      });

      it('reverts when caller has no approval or operator permission', async function () {
        await expect(this.token.connect(this.other).requestRedeem(shareAmount, this.holder, this.holder))
          .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientAllowance')
          .withArgs(this.other, 0n, shareAmount);
      });

      it('reverts when owner has insufficient share balance', async function () {
        await expect(
          this.token.connect(this.other).requestRedeem(shareAmount, this.other, this.other),
        ).to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance');
      });

      describe('with valid request', function () {
        beforeEach(async function () {
          this.tx = await this.token.connect(this.holder).requestRedeem(shareAmount, this.holder, this.holder);
        });

        it('emits a RedeemRequest event', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'RedeemRequest')
            .withArgs(this.holder, this.holder, REQUEST_ID, this.holder, shareAmount);
        });

        it('transfers shares from owner to vault', async function () {
          await expect(this.token.balanceOf(this.holder)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(this.token)).to.eventually.equal(shareAmount);
        });

        it('updates pendingRedeemRequest', async function () {
          await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(shareAmount);
        });

        it('accumulates on multiple requests', async function () {
          const extra = 500n;
          await this.token.$_mint(this.holder, extra);
          await this.token.connect(this.holder).requestRedeem(extra, this.holder, this.holder);

          await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(
            shareAmount + extra,
          );
        });
      });

      describe('with operator', function () {
        it('operator can request on behalf of owner', async function () {
          await this.token.connect(this.holder).setOperator(this.operator, true);

          await expect(this.token.connect(this.operator).requestRedeem(shareAmount, this.holder, this.holder))
            .to.emit(this.token, 'RedeemRequest')
            .withArgs(this.holder, this.holder, REQUEST_ID, this.operator, shareAmount);
        });
      });
    });

    describe('_fulfillRedeem', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, shareAmount);
        await this.asset.$_mint(this.token, assetAmount);
        await this.token.connect(this.holder).requestRedeem(shareAmount, this.holder, this.holder);
      });

      it('reverts when fulfilling more than pending', async function () {
        await expect(this.token.$_fulfillRedeem(shareAmount + 1n, this.holder))
          .to.be.revertedWithCustomError(this.token, 'ERC7540RedeemInsufficientPendingShares')
          .withArgs(shareAmount + 1n, shareAmount);
      });

      describe('full fulfillment', function () {
        beforeEach(async function () {
          this.expectedAssets = assetAmount; // 1:1 rate
          this.tx = await this.token.$_fulfillRedeem(shareAmount, this.holder);
        });

        it('emits RedeemClaimable', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'RedeemClaimable')
            .withArgs(this.holder, REQUEST_ID, this.expectedAssets, shareAmount);
        });

        it('clears pending redeem', async function () {
          await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        });

        it('updates claimable redeem', async function () {
          await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(shareAmount);
          await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(
            this.expectedAssets,
          );
        });

        it('updates maxWithdraw and maxRedeem', async function () {
          await expect(this.token.maxWithdraw(this.holder)).to.eventually.equal(this.expectedAssets);
          await expect(this.token.maxRedeem(this.holder)).to.eventually.equal(shareAmount);
        });

        it('burns shares from the vault', async function () {
          await expect(this.token.balanceOf(this.token)).to.eventually.equal(0n);
        });
      });

      describe('partial fulfillment', function () {
        const partialShares = 400n;

        beforeEach(async function () {
          this.tx = await this.token.$_fulfillRedeem(partialShares, this.holder);
        });

        it('emits RedeemClaimable for the partial amount', async function () {
          await expect(this.tx)
            .to.emit(this.token, 'RedeemClaimable')
            .withArgs(this.holder, REQUEST_ID, partialShares, partialShares);
        });

        it('partially transitions pending to claimable', async function () {
          await expect(this.token.pendingRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(
            shareAmount - partialShares,
          );
          await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(partialShares);
        });
      });
    });

    describe('withdraw (claim)', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, shareAmount);
        await this.asset.$_mint(this.token, assetAmount);
        await this.token.connect(this.holder).requestRedeem(shareAmount, this.holder, this.holder);
        await this.token.$_fulfillRedeem(shareAmount, this.holder);
        this.expectedAssets = assetAmount; // 1:1 rate
      });

      it('reverts when caller is not controller or operator', async function () {
        await expect(this.token.connect(this.other).withdraw(this.expectedAssets, this.recipient, this.holder))
          .to.be.revertedWithCustomError(this.token, 'ERC7540InvalidOperator')
          .withArgs(this.holder, this.other);
      });

      it('transfers assets to receiver and emits Withdraw', async function () {
        const tx = await this.token.connect(this.holder).withdraw(this.expectedAssets, this.recipient, this.holder);

        await expect(tx)
          .to.emit(this.token, 'Withdraw')
          .withArgs(this.holder, this.recipient, this.holder, this.expectedAssets, shareAmount);

        await expect(this.asset.balanceOf(this.recipient)).to.eventually.equal(this.expectedAssets);
      });

      it('clears claimable after full claim', async function () {
        await this.token.connect(this.holder).withdraw(this.expectedAssets, this.recipient, this.holder);

        await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        await expect(this.token.maxWithdraw(this.holder)).to.eventually.equal(0n);
      });

      it('can partially claim', async function () {
        const partialAssets = 400n;
        await this.token.connect(this.holder).withdraw(partialAssets, this.recipient, this.holder);

        await expect(this.asset.balanceOf(this.recipient)).to.eventually.equal(partialAssets);
        await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(
          this.expectedAssets - partialAssets,
        );
      });

      it('operator can claim on behalf of controller', async function () {
        await this.token.connect(this.holder).setOperator(this.operator, true);

        await expect(this.token.connect(this.operator).withdraw(this.expectedAssets, this.recipient, this.holder))
          .to.emit(this.token, 'Withdraw')
          .withArgs(this.operator, this.recipient, this.holder, this.expectedAssets, shareAmount);
      });
    });

    describe('redeem (claim)', function () {
      beforeEach(async function () {
        await this.token.$_mint(this.holder, shareAmount);
        await this.asset.$_mint(this.token, assetAmount);
        await this.token.connect(this.holder).requestRedeem(shareAmount, this.holder, this.holder);
        await this.token.$_fulfillRedeem(shareAmount, this.holder);
        this.expectedAssets = assetAmount; // 1:1 rate
      });

      it('reverts when caller is not controller or operator', async function () {
        await expect(this.token.connect(this.other).redeem(shareAmount, this.recipient, this.holder))
          .to.be.revertedWithCustomError(this.token, 'ERC7540InvalidOperator')
          .withArgs(this.holder, this.other);
      });

      it('transfers assets to receiver and emits Withdraw', async function () {
        const tx = await this.token.connect(this.holder).redeem(shareAmount, this.recipient, this.holder);

        await expect(tx)
          .to.emit(this.token, 'Withdraw')
          .withArgs(this.holder, this.recipient, this.holder, this.expectedAssets, shareAmount);

        await expect(this.asset.balanceOf(this.recipient)).to.eventually.equal(this.expectedAssets);
      });

      it('clears claimable after full claim', async function () {
        await this.token.connect(this.holder).redeem(shareAmount, this.recipient, this.holder);

        await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        await expect(this.token.claimableRedeemRequestAssets(REQUEST_ID, this.holder)).to.eventually.equal(0n);
        await expect(this.token.maxRedeem(this.holder)).to.eventually.equal(0n);
      });

      it('can partially claim', async function () {
        const partialShares = 400n;
        const partialAssets = 400n; // 1:1

        await this.token.connect(this.holder).redeem(partialShares, this.recipient, this.holder);

        await expect(this.asset.balanceOf(this.recipient)).to.eventually.equal(partialAssets);
        await expect(this.token.claimableRedeemRequest(REQUEST_ID, this.holder)).to.eventually.equal(
          shareAmount - partialShares,
        );
      });

      it('operator can claim on behalf of controller', async function () {
        await this.token.connect(this.holder).setOperator(this.operator, true);

        await expect(this.token.connect(this.operator).redeem(shareAmount, this.recipient, this.holder))
          .to.emit(this.token, 'Withdraw')
          .withArgs(this.operator, this.recipient, this.holder, this.expectedAssets, shareAmount);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC7540Deposit,
  shouldBehaveLikeERC7540Redeem,
};
