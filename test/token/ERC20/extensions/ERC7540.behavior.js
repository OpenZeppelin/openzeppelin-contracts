import { ethers } from 'ethers';
import { expect } from 'chai';
import { batchInBlock } from '../../../helpers/txpool';
import { interfaceId } from '../../../helpers/methods';
import { shouldSupportInterfaces } from '../../../utils/introspection/SupportsInterface.behavior';

const ERC7540Operator = ['setOperator(address,bool)', 'isOperator(address,address)'];
const ERC7540Deposit = [
  'requestDeposit(uint256,address,address)',
  'pendingDepositRequest(uint256,address)',
  'claimableDepositRequest(uint256,address)',
  'deposit(uint256,address,address)',
  'mint(uint256,address,address)',
];
const ERC7540Redeem = [
  'requestRedeem(uint256,address,address)',
  'pendingRedeemRequest(uint256,address)',
  'claimableRedeemRequest(uint256,address)',
];

function shouldBehaveLikeERC7540Operator() {
  describe('Should behave like ERC7540Operator', function () {
    before(async function () {
      [this.owner, this.controller, this.receiver, this.operator, this.other] = await this.ethers.getSigners();
    });

    describe('supports ERC-7540 operator interface', function () {
      expect(interfaceId(ERC7540Operator)).to.equal('0xe3bc4e65');
      shouldSupportInterfaces({ ERC7540Operator });
    });

    for (const status of [true, false]) {
      it(`setOperator to ${status} emits event and updates status`, async function () {
        await expect(this.mock.connect(this.owner).setOperator(this.operator, status))
          .to.emit(this.mock, 'OperatorSet')
          .withArgs(this.owner, this.operator, status);

        await expect(this.mock.isOperator(this.owner, this.operator)).to.eventually.equal(status);
      });

      it(`setOperator to ${status} reverts if the operator is the controller`, async function () {
        await expect(this.mock.connect(this.owner).setOperator(this.owner, status))
          .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidSelfOperator')
          .withArgs(this.owner);
      });
    }
  });
}

function shouldBehaveLikeERC7540Deposit({
  initialAssets,
  initialShares,
  balance,
  supportCustomFulfill,
  settleOnFulfill,
  gateOnController,
} = {}) {
  initialAssets ??= ethers.parseEther('17000000');
  initialShares ??= ethers.parseEther('42000000');
  balance ??= ethers.parseEther('1000');
  supportCustomFulfill ??= true;
  settleOnFulfill ??= true; // whether the strategy locks the rate at fulfillment (vs. at claim time)
  gateOnController ??= false;

  describe('Should behave like ERC7540Deposit', function () {
    before(async function () {
      [this.owner, this.controller, this.receiver, this.operator, this.other] = await this.ethers.getSigners();
    });

    beforeEach(async function () {
      await this.token.$_mint(this.mock, initialAssets);
      await this.mock.$_mint(this.owner, initialShares);

      await this.token.$_mint(this.owner, balance);
      await this.token.connect(this.owner).approve(this.mock, ethers.MaxUint256);
      await this.mock.connect(this.owner).setOperator(this.operator, true);
      await this.mock.connect(this.controller).setOperator(this.operator, true);
      if (gateOnController) {
        await this.mock.connect(this.controller).setOperator(this.owner, true);
      }
    });

    describe('supports ERC-7540 operator interface', function () {
      expect(interfaceId(ERC7540Deposit)).to.equal('0xce3bbe50');
      shouldSupportInterfaces({ ERC7540Deposit });
    });

    describe('Disabled ERC4626 functions', function () {
      it('previewDeposit', async function () {
        await expect(this.mock.previewDeposit(0n)).to.be.revertedWithCustomError(this.mock, 'ERC7540AsyncDeposit');
      });

      it('previewMint', async function () {
        await expect(this.mock.previewMint(0n)).to.be.revertedWithCustomError(this.mock, 'ERC7540AsyncDeposit');
      });
    });

    describe('Asynchronous operation', function () {
      const assets = ethers.parseEther('100');
      const shares = (assets * initialShares) / initialAssets;

      describe('requestDeposit', function () {
        it('transfers tokens, marks as pending, emits DepositRequest', async function () {
          const assetsBefore = await this.mock.totalAssets();
          const sharesBefore = await this.mock.$_totalOutstandingShares();
          const convertToAssetsBefore = await this.mock.convertToAssets(shares);
          const convertToSharesBefore = await this.mock.convertToShares(assets);

          const tx = this.mock.connect(this.owner).requestDeposit(assets, this.controller, this.owner);
          const requestId = await this.getRequestId(tx);

          await expect(tx)
            .to.emit(this.mock, 'DepositRequest')
            .withArgs(this.controller, this.owner, requestId, this.owner, assets);
          await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.owner, this.mock], [-assets, assets]);
          await expect(tx).to.changeTokenBalances(this.ethers, this.mock, [this.controller], [0n]);

          await expect(this.mock.totalAssets()).to.eventually.equal(assetsBefore);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(sharesBefore);
          await expect(this.mock.convertToAssets(shares)).to.eventually.equal(convertToAssetsBefore);
          await expect(this.mock.convertToShares(assets)).to.eventually.equal(convertToSharesBefore);

          await expect(this.mock.pendingDepositRequest(requestId, this.controller)).to.eventually.equal(assets);
          await expect(this.mock.claimableDepositRequest(requestId, this.controller)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(this.controller)).to.eventually.equal(0n);

          // check for side effects (timepoint-1 overflow)
          if (requestId != 0) {
            await expect(this.mock.pendingDepositRequest(0n, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(0n, this.controller)).to.eventually.equal(0n);
          }
        });

        it('operator can trigger request deposit on behalf of owner', async function () {
          const tx = this.mock.connect(this.operator).requestDeposit(assets, this.controller, this.owner);
          const requestId = await this.getRequestId(tx);

          await expect(tx)
            .to.emit(this.mock, 'DepositRequest')
            .withArgs(this.controller, this.owner, requestId, this.operator, assets);
          await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.owner, this.mock], [-assets, assets]);
          await expect(tx).to.changeTokenBalances(this.ethers, this.mock, [this.controller], [0n]);
        });

        it('reverts when caller is neither owner nor operator of owner', async function () {
          await expect(this.mock.connect(this.other).requestDeposit(assets, this.controller, this.owner))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
            .withArgs(this.owner, this.other);
        });

        it('accumulates pending across multiple requests', async function () {
          const [tx1, tx2] = await batchInBlock(
            [
              () =>
                this.mock.connect(this.owner).requestDeposit(17n, this.controller, this.owner, { gasLimit: 200000n }),
              () =>
                this.mock.connect(this.owner).requestDeposit(42n, this.controller, this.owner, { gasLimit: 200000n }),
            ],
            this.ethers.provider,
          );

          const requestId1 = await this.getRequestId(tx1);
          const requestId2 = await this.getRequestId(tx2);
          expect(requestId1).to.equal(requestId2);

          await expect(this.mock.pendingDepositRequest(requestId1, this.controller)).to.eventually.equal(17n + 42n);
          await expect(this.mock.claimableDepositRequest(requestId1, this.controller)).to.eventually.equal(0n);
        });
      });

      supportCustomFulfill &&
        describe('fulfillDeposit', function () {
          beforeEach(async function () {
            this.requestId = await this.mock
              .connect(this.owner)
              .requestDeposit(assets, this.controller, this.owner)
              .then(this.getRequestId);
          });

          it('transitions pending to claimable and emits DepositClaimable', async function () {
            const assetsBefore = await this.mock.totalAssets();
            const sharesBefore = await this.mock.$_totalOutstandingShares();

            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(assets);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(0n);

            await this.fulfillDeposit(this.requestId, assets, shares, this.controller);

            // Fulfilled requests are settled at the locked rate, regardless of the share custody model
            await expect(this.mock.totalAssets()).to.eventually.equal(assetsBefore + assets);
            await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(sharesBefore + shares);

            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(
              assets,
            );
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(assets);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(shares);
          });

          it('supports admin-determined share ratio', async function () {
            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(assets);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(0n);

            await this.fulfillDeposit(this.requestId, assets, 42n, this.controller);

            await expect(this.mock.pendingDepositRequest(0n, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(0n, this.controller)).to.eventually.equal(assets);
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(assets);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(42n);
          });

          it('can be partially fulfilled', async function () {
            await expect(this.mock.pendingDepositRequest(0n, this.controller)).to.eventually.equal(assets);
            await expect(this.mock.claimableDepositRequest(0n, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(0n);

            await this.fulfillDeposit(this.requestId, 17n, 42n, this.controller);

            await expect(this.mock.pendingDepositRequest(0n, this.controller)).to.eventually.equal(assets - 17n);
            await expect(this.mock.claimableDepositRequest(0n, this.controller)).to.eventually.equal(17n);
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(17n);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(42n);
          });

          it('reverts when fulfilling more than pending', async function () {
            await expect(this.fulfillDeposit(this.requestId, assets + 1n, shares, this.controller))
              .to.be.revertedWithCustomError(this.mock, 'ERC7540DepositInsufficientPendingAssets')
              .withArgs(assets + 1n, assets);
          });

          it('_mintSharesOnDepositFulfill is blocked when _depositShareOrigin() is address(0)', async function () {
            const depositShareOrigin = await this.mock.$_depositShareOrigin();
            if (depositShareOrigin == ethers.ZeroAddress) {
              await expect(this.mock.$_mintSharesOnDepositFulfill(0n, 0n)).to.be.revertedWithCustomError(
                this.mock,
                'ERC7540UnauthorizedMintSharesOnDepositFulfill',
              );
            } else {
              this.skip();
            }
          });
        });

      describe('claim', function () {
        beforeEach(async function () {
          ((this.requestId = await this.mock
            .connect(this.owner)
            .requestDeposit(assets, this.controller, this.owner)
            .then(this.getRequestId)),
            await this.fulfillDeposit(this.requestId, assets, shares, this.controller));
        });

        describe('via deposit()', function () {
          it('mints shares to receiver and emits Deposit', async function () {
            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(
              assets,
            );
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(assets);

            const assetsBefore = await this.mock.totalAssets();
            const sharesBefore = await this.mock.$_totalOutstandingShares();

            const tx = this.mock
              .connect(this.controller)
              .deposit(assets, this.receiver, ethers.Typed.address(this.controller));

            await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.controller, this.receiver, assets, shares);
            await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, shares);

            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxDeposit(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.totalAssets()).to.eventually.equal(
              settleOnFulfill ? assetsBefore : assetsBefore + assets,
            );
            await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(
              settleOnFulfill ? sharesBefore : sharesBefore + shares,
            );
          });

          it('operator can trigger deposit on behalf of controller', async function () {
            const tx = this.mock
              .connect(this.operator)
              .deposit(assets, this.receiver, ethers.Typed.address(this.controller));

            await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.controller, this.receiver, assets, shares);
            await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, shares);
          });

          it('reverts when trying to deposit more than what is claimable', async function () {
            await expect(
              this.mock
                .connect(this.controller)
                .deposit(assets + 1n, this.receiver, ethers.Typed.address(this.controller)),
            )
              .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxDeposit')
              .withArgs(this.controller, assets + 1n, assets);
          });

          it('reverts when caller is neither owner nor operator of owner', async function () {
            await expect(
              this.mock.connect(this.other).deposit(assets, this.receiver, ethers.Typed.address(this.controller)),
            )
              .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
              .withArgs(this.controller, this.other);
          });

          it('empty deposit when nothing is claimable', async function () {
            const tx = this.mock
              .connect(this.controller)
              .deposit(0n, this.receiver, ethers.Typed.address(this.controller));
            await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.controller, this.receiver, 0n, 0n);
            await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, 0n);
          });
        });

        describe('via mint()', function () {
          it('mints exactly the requested shares and emits Deposit', async function () {
            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(
              assets,
            );
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(shares);

            const assetsBefore = await this.mock.totalAssets();
            const sharesBefore = await this.mock.$_totalOutstandingShares();

            const tx = this.mock
              .connect(this.controller)
              .mint(shares, this.receiver, ethers.Typed.address(this.controller));

            await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.controller, this.receiver, assets, shares);

            await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, shares);

            await expect(this.mock.pendingDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableDepositRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxMint(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.totalAssets()).to.eventually.equal(
              settleOnFulfill ? assetsBefore : assetsBefore + assets,
            );
            await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(
              settleOnFulfill ? sharesBefore : sharesBefore + shares,
            );
          });

          it('operator can trigger mint on behalf of controller', async function () {
            const tx = this.mock
              .connect(this.operator)
              .mint(shares, this.receiver, ethers.Typed.address(this.controller));

            await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.controller, this.receiver, assets, shares);
            await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, shares);
          });

          it('reverts when trying to mint more than what is claimable', async function () {
            await expect(
              this.mock
                .connect(this.controller)
                .mint(shares + 1n, this.receiver, ethers.Typed.address(this.controller)),
            )
              .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxMint')
              .withArgs(this.controller, shares + 1n, shares);
          });

          it('reverts when caller is neither owner nor operator of owner', async function () {
            await expect(
              this.mock.connect(this.other).mint(shares, this.receiver, ethers.Typed.address(this.controller)),
            )
              .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
              .withArgs(this.controller, this.other);
          });

          it('empty mint when nothing is claimable', async function () {
            const tx = this.mock
              .connect(this.controller)
              .mint(0n, this.receiver, ethers.Typed.address(this.controller));
            await expect(tx).to.emit(this.mock, 'Deposit').withArgs(this.controller, this.receiver, 0n, 0n);
            await expect(tx).to.changeTokenBalance(this.ethers, this.mock, this.receiver, 0n);
          });
        });
      });
    });
  });
}

function shouldBehaveLikeERC7540Redeem({
  initialAssets,
  initialShares,
  balance,
  supportCustomFulfill,
  settleOnFulfill,
  gateOnController,
} = {}) {
  initialAssets ??= ethers.parseEther('17000000');
  initialShares ??= ethers.parseEther('42000000');
  balance ??= ethers.parseEther('1000');
  supportCustomFulfill ??= true;
  settleOnFulfill ??= true; // whether the strategy locks the rate at fulfillment (vs. at claim time)
  gateOnController ??= false;

  describe('Should behave like ERC7540Redeem', function () {
    before(async function () {
      [this.owner, this.controller, this.receiver, this.operator, this.other] = await this.ethers.getSigners();
    });

    beforeEach(async function () {
      await this.token.$_mint(this.mock, initialAssets);
      await this.mock.$_mint(this.owner, initialShares);

      await this.token.$_mint(this.owner, balance);
      await this.token.connect(this.owner).approve(this.mock, ethers.MaxUint256);
      await this.mock.connect(this.owner).setOperator(this.operator, true);
      await this.mock.connect(this.controller).setOperator(this.operator, true);
      if (gateOnController) {
        await this.mock.connect(this.controller).setOperator(this.owner, true);
      }
    });

    describe('supports ERC-7540 operator interface', function () {
      expect(interfaceId(ERC7540Redeem)).to.equal('0x620ee8e4');
      shouldSupportInterfaces({ ERC7540Redeem });
    });

    describe('Disabled ERC4626 functions', function () {
      it('previewWithdraw', async function () {
        await expect(this.mock.previewWithdraw(0n)).to.be.revertedWithCustomError(this.mock, 'ERC7540AsyncRedeem');
      });

      it('previewRedeem', async function () {
        await expect(this.mock.previewRedeem(0n)).to.be.revertedWithCustomError(this.mock, 'ERC7540AsyncRedeem');
      });
    });

    describe('Asynchronous operation', function () {
      const shares = ethers.parseEther('100');
      const assets = (shares * initialAssets) / initialShares;

      describe('requestRedeem', function () {
        it('takes shares from the owner, marks as pending, emits RedeemRequest', async function () {
          const assetsBefore = await this.mock.totalAssets();
          const sharesBefore = await this.mock.$_totalOutstandingShares();
          const convertToAssetsBefore = await this.mock.convertToAssets(shares);
          const convertToSharesBefore = await this.mock.convertToShares(assets);

          // perform request redeem, and extract requestId from timing
          const tx = this.mock.connect(this.owner).requestRedeem(shares, this.controller, this.owner);
          const requestId = await this.getRequestId(tx);

          // check event is emitted and shares are taken from the owner (burned or escrowed)
          await expect(tx)
            .to.emit(this.mock, 'RedeemRequest')
            .withArgs(this.controller, this.owner, requestId, this.owner, shares);
          await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.controller, this.mock], [0n, 0n]);
          await expect(tx).to.changeTokenBalances(this.ethers, this.mock, [this.owner], [-shares]);

          // _totalOutstandingShares includes shares for in-flight redeem
          await expect(this.mock.totalAssets()).to.eventually.equal(assetsBefore);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(sharesBefore);
          await expect(this.mock.convertToAssets(shares)).to.eventually.equal(convertToAssetsBefore);
          await expect(this.mock.convertToShares(assets)).to.eventually.equal(convertToSharesBefore);

          // check pending redeem is registered
          await expect(this.mock.pendingRedeemRequest(requestId, this.controller)).to.eventually.equal(shares);
          await expect(this.mock.claimableRedeemRequest(requestId, this.controller)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(0n);

          // check for side effects (timepoint-1 overflow)
          if (requestId != 0) {
            await expect(this.mock.pendingRedeemRequest(0n, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(0n, this.controller)).to.eventually.equal(0n);
          }
        });

        it('operator can trigger request redeem on behalf of owner', async function () {
          const tx = this.mock.connect(this.operator).requestRedeem(shares, this.controller, this.owner);
          const requestId = await this.getRequestId(tx);

          await expect(tx)
            .to.emit(this.mock, 'RedeemRequest')
            .withArgs(this.controller, this.owner, requestId, this.operator, shares);
          await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.controller, this.mock], [0n, 0n]);
          await expect(tx).to.changeTokenBalances(this.ethers, this.mock, [this.owner], [-shares]);
        });

        it('spends allowance when caller is neither owner nor operator', async function () {
          await this.mock.connect(this.owner).approve(this.other, shares);
          if (gateOnController) {
            await this.mock.connect(this.controller).setOperator(this.other, true);
          }

          const tx = this.mock.connect(this.other).requestRedeem(shares, this.controller, this.owner);
          const requestId = await this.getRequestId(tx);

          await expect(tx)
            .to.emit(this.mock, 'RedeemRequest')
            .withArgs(this.controller, this.owner, requestId, this.other, shares);

          await expect(this.mock.allowance(this.owner, this.other)).to.eventually.equal(0n);
        });

        it('revert of caller is neither owner nor operator and has no allowance', async function () {
          if (gateOnController) {
            await this.mock.connect(this.controller).setOperator(this.other, true);
          }

          await expect(this.mock.connect(this.other).requestRedeem(shares, this.controller, this.owner))
            .to.be.revertedWithCustomError(this.mock, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, shares);
        });

        it('accumulates pending across multiple requests', async function () {
          const [tx1, tx2] = await batchInBlock(
            [
              () =>
                this.mock.connect(this.operator).requestRedeem(17n, this.controller, this.owner, { gasLimit: 200000n }),
              () =>
                this.mock.connect(this.operator).requestRedeem(42n, this.controller, this.owner, { gasLimit: 200000n }),
            ],
            this.ethers.provider,
          );

          const requestId1 = await this.getRequestId(tx1);
          const requestId2 = await this.getRequestId(tx2);
          expect(requestId1).to.equal(requestId2);

          await expect(this.mock.pendingRedeemRequest(requestId1, this.controller)).to.eventually.equal(17n + 42n);
          await expect(this.mock.claimableRedeemRequest(requestId1, this.controller)).to.eventually.equal(0n);
        });
      });

      supportCustomFulfill &&
        describe('fulfillRedeem', function () {
          beforeEach(async function () {
            this.requestId = await this.mock
              .connect(this.owner)
              .requestRedeem(shares, this.controller, this.owner)
              .then(this.getRequestId);
          });

          it('transitions pending to claimable and emits RedeemClaimable', async function () {
            const assetsBefore = await this.mock.totalAssets();
            const sharesBefore = await this.mock.$_totalOutstandingShares();

            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(0n);

            await this.fulfillRedeem(this.requestId, assets, shares, this.controller);

            // Fulfilled requests are settled at the locked rate
            await expect(this.mock.totalAssets()).to.eventually.equal(assetsBefore - assets);
            await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(sharesBefore - shares);

            await expect(this.mock.pendingRedeemRequest(0n, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(0n, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(assets);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(shares);
          });

          it('supports admin-determined asset ratio', async function () {
            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(0n);

            await this.fulfillRedeem(this.requestId, 17n, shares, this.controller);

            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(17n);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(shares);
          });

          it('can be partially fulfilled', async function () {
            await expect(this.mock.pendingRedeemRequest(0n, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.claimableRedeemRequest(0n, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(0n);

            await this.fulfillRedeem(this.requestId, 17n, 42n, this.controller);

            await expect(this.mock.pendingRedeemRequest(0n, this.controller)).to.eventually.equal(shares - 42n);
            await expect(this.mock.claimableRedeemRequest(0n, this.controller)).to.eventually.equal(42n);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(17n);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(42n);
          });

          it('reverts when fulfilling more than pending', async function () {
            await expect(this.fulfillRedeem(this.requestId, assets, shares + 1n, this.controller))
              .to.be.revertedWithCustomError(this.mock, 'ERC7540RedeemInsufficientPendingShares')
              .withArgs(shares + 1n, shares);
          });

          it('reverts when fulfilling more assets than the vault holds', async function () {
            const vaultBalance = await this.token.balanceOf(this.mock);
            await expect(
              this.fulfillRedeem(this.requestId, vaultBalance + 1n, shares, this.controller),
            ).to.be.revertedWithCustomError(this.mock, 'ERC7540InsufficientAssets');
          });

          it('_burnSharesOnRedeemFulfill is blocked when _redeemShareDestination() is address(0)', async function () {
            const redeemShareDestination = await this.mock.$_redeemShareDestination();
            if (redeemShareDestination == ethers.ZeroAddress) {
              await expect(this.mock.$_burnSharesOnRedeemFulfill(0n, 0n)).to.be.revertedWithCustomError(
                this.mock,
                'ERC7540UnauthorizedBurnSharesOnRedeemFulfill',
              );
            } else {
              this.skip();
            }
          });
        });

      describe('claim', function () {
        beforeEach(async function () {
          this.requestId = await this.mock
            .connect(this.owner)
            .requestRedeem(shares, this.controller, this.owner)
            .then(this.getRequestId);
          await this.fulfillRedeem(this.requestId, assets, shares, this.controller);
        });

        describe('via redeem()', function () {
          it('transfers tokens to receiver and emits Withdraw', async function () {
            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(shares);

            const assetsBefore = await this.mock.totalAssets();
            const sharesBefore = await this.mock.$_totalOutstandingShares();

            const tx = this.mock.connect(this.controller).redeem(shares, this.receiver, this.controller);

            await expect(tx)
              .to.emit(this.mock, 'Withdraw')
              .withArgs(this.controller, this.receiver, this.controller, assets, shares);
            await expect(tx).to.changeTokenBalances(
              this.ethers,
              this.token,
              [this.mock, this.receiver],
              [-assets, assets],
            );

            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxRedeem(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.totalAssets()).to.eventually.equal(
              settleOnFulfill ? assetsBefore : assetsBefore - assets,
            );
            await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(
              settleOnFulfill ? sharesBefore : sharesBefore - shares,
            );
          });

          it('operator can trigger redeem on behalf of controller', async function () {
            const tx = this.mock.connect(this.operator).redeem(shares, this.receiver, this.controller);

            await expect(tx)
              .to.emit(this.mock, 'Withdraw')
              .withArgs(this.operator, this.receiver, this.controller, assets, shares);
            await expect(tx).to.changeTokenBalances(
              this.ethers,
              this.token,
              [this.mock, this.receiver],
              [-assets, assets],
            );
          });

          it('reverts when trying to redeem more than what is claimable', async function () {
            await expect(this.mock.connect(this.controller).redeem(shares + 1n, this.receiver, this.controller))
              .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxRedeem')
              .withArgs(this.controller, shares + 1n, shares);
          });

          it('reverts when caller is neither owner nor operator of owner', async function () {
            await expect(this.mock.connect(this.other).redeem(shares, this.receiver, this.controller))
              .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
              .withArgs(this.controller, this.other);
          });

          it('empty redeem when nothing is claimable', async function () {
            const tx = this.mock.connect(this.controller).redeem(0n, this.receiver, this.controller);
            await expect(tx)
              .to.emit(this.mock, 'Withdraw')
              .withArgs(this.controller, this.receiver, this.controller, 0n, 0n);
            await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.mock, this.receiver], [0n, 0n]);
          });
        });

        describe('via withdraw()', function () {
          it('transfers exactly the requested tokens and emits Withdraw', async function () {
            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(shares);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(assets);

            const assetsBefore = await this.mock.totalAssets();
            const sharesBefore = await this.mock.$_totalOutstandingShares();

            const tx = this.mock.connect(this.controller).withdraw(assets, this.receiver, this.controller);

            await expect(tx)
              .to.emit(this.mock, 'Withdraw')
              .withArgs(this.controller, this.receiver, this.controller, assets, shares);
            await expect(tx).to.changeTokenBalances(
              this.ethers,
              this.token,
              [this.mock, this.receiver],
              [-assets, assets],
            );

            await expect(this.mock.pendingRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.claimableRedeemRequest(this.requestId, this.controller)).to.eventually.equal(0n);
            await expect(this.mock.maxWithdraw(this.controller)).to.eventually.equal(0n);
            await expect(this.mock.totalAssets()).to.eventually.equal(
              settleOnFulfill ? assetsBefore : assetsBefore - assets,
            );
            await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(
              settleOnFulfill ? sharesBefore : sharesBefore - shares,
            );
          });

          it('operator can trigger withdraw on behalf of controller', async function () {
            const tx = this.mock.connect(this.operator).withdraw(assets, this.receiver, this.controller);

            await expect(tx)
              .to.emit(this.mock, 'Withdraw')
              .withArgs(this.operator, this.receiver, this.controller, assets, shares);
            await expect(tx).to.changeTokenBalances(
              this.ethers,
              this.token,
              [this.mock, this.receiver],
              [-assets, assets],
            );
          });

          it('reverts when trying to withdraw more than what is claimable', async function () {
            await expect(this.mock.connect(this.controller).withdraw(assets + 1n, this.receiver, this.controller))
              .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxWithdraw')
              .withArgs(this.controller, assets + 1n, assets);
          });

          it('reverts when caller is neither owner nor operator of owner', async function () {
            await expect(this.mock.connect(this.other).withdraw(assets, this.receiver, this.controller))
              .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
              .withArgs(this.controller, this.other);
          });

          it('empty withdraw when nothing is claimable', async function () {
            const tx = this.mock.connect(this.controller).withdraw(0n, this.receiver, this.controller);
            await expect(tx)
              .to.emit(this.mock, 'Withdraw')
              .withArgs(this.controller, this.receiver, this.controller, 0n, 0n);
            await expect(tx).to.changeTokenBalances(this.ethers, this.token, [this.mock, this.receiver], [0n, 0n]);
          });
        });
      });
    });
  });
}

export { shouldBehaveLikeERC7540Operator, shouldBehaveLikeERC7540Deposit, shouldBehaveLikeERC7540Redeem };
