import { network } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeERC7540Operator, shouldBehaveLikeERC7540Redeem } from './ERC7540.behavior';
import { shouldBehaveLikeERC7575 } from './ERC7575.behavior';

const {
  ethers,
  helpers: { time },
  networkHelpers: { loadFixture },
} = await network.create();

const name = 'Vault Shares';
const symbol = 'vSHR';
const tokenName = 'Asset Token';
const tokenSymbol = 'AST';
const week = 7n * 24n * 3600n;
// `currentRedeemEpoch() = (block.timestamp + 3 days) / week`, so epoch `N` starts at Monday
// 00:00 UTC of that week (`t = N * week - 3 days`).
const MONDAY_OFFSET = 3n * 24n * 3600n;

// Advances time to the start of `epochId`, so that `currentRedeemEpoch() >= epochId`. No-op if already there.
async function advanceTo(epochId) {
  const now = await time.clock.timestamp();
  const target = epochId * week - MONDAY_OFFSET;
  if (now < target) await time.increaseTo.timestamp(target);
}

describe('ERC7540EpochRedeem', function () {
  before(function () {
    this.ethers = ethers;
  });

  for (const withTmpHolder of [false, true]) {
    describe(withTmpHolder ? 'With a temporary share holder' : 'With direct share operations', function () {
      async function fixture() {
        const token = await ethers.deployContract('$ERC20', [tokenName, tokenSymbol]);
        const mock = await ethers.deployContract('$ERC7540EpochMock', [
          name,
          symbol,
          token,
          withTmpHolder ? '0x000000000000000000000000000000000000dead' : ethers.ZeroAddress,
        ]);
        return { token, mock };
      }

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        this.getRequestId = tx =>
          time.clockFromReceipt.timestamp(tx).then(timestamp => (timestamp + MONDAY_OFFSET) / week);

        this.fulfillDeposit = async (requestId, _assets, shares) => {
          await advanceTo(requestId + 1n);
          return this.mock.$_fulfillDeposit(requestId, shares);
        };
        this.fulfillRedeem = async (requestId, assets) => {
          await advanceTo(requestId + 1n);
          return this.mock.$_fulfillRedeem(requestId, assets);
        };
      });

      describe('metadata', function () {
        it('token', async function () {
          await expect(this.mock.asset()).to.eventually.equal(this.token);
        });

        it('name, symbol, decimals', async function () {
          await expect(this.mock.name()).to.eventually.equal(name);
          await expect(this.mock.symbol()).to.eventually.equal(symbol);
          await expect(this.mock.decimals()).to.eventually.equal(18n);
        });

        it('reports async deposit and redeem', async function () {
          await expect(this.mock.$_isDepositAsync()).to.eventually.equal(true);
          await expect(this.mock.$_isRedeemAsync()).to.eventually.equal(true);
        });

        it('default epoch matches `(block.timestamp + 3 days) / 1 weeks`', async function () {
          const now = await time.clock.timestamp();
          await expect(this.mock.currentRedeemEpoch()).to.eventually.equal((now + MONDAY_OFFSET) / week);
        });
      });

      shouldBehaveLikeERC7540Operator();
      shouldBehaveLikeERC7540Redeem({ supportCustomFulfill: false, gateOnController: true });
      shouldBehaveLikeERC7575();

      describe('epoch state and getters', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);
        });

        it('`requestRedeem` returns the current epoch as `requestId`', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const expected = ((await time.clockFromReceipt.timestamp(tx)) + MONDAY_OFFSET) / week;
          await expect(tx).to.emit(this.mock, 'RedeemRequest').withArgs(user, user, expected, user, 100n);
        });

        it('`_convertToRedeemAssets` returns 0 when `totalShares == 0`', async function () {
          // unknown epoch -> totalShares = 0
          await expect(this.mock.$_convertToRedeemAssets(999n, 100n, 0n)).to.eventually.equal(0n);
        });

        it('`_convertToRedeemShares` returns 0 when `totalAssets == 0`', async function () {
          // pending epoch -> totalAssets = 0
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await expect(this.mock.$_convertToRedeemShares(epochId, 50n, 0n)).to.eventually.equal(0n);
        });

        it('`_convertToRedeemAssets` applies the locked rate', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 50n); // rate 1 share = 0.5 assets

          // Floor: floor(40 * 50 / 100) = 20
          await expect(this.mock.$_convertToRedeemAssets(epochId, 40n, 0n)).to.eventually.equal(20n);
          // Ceil: ceil(33 * 50 / 100) = 17
          await expect(this.mock.$_convertToRedeemAssets(epochId, 33n, 1n)).to.eventually.equal(17n);
        });

        it('`_convertToRedeemShares` applies the locked rate', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 50n);

          // Floor: floor(10 * 100 / 50) = 20
          await expect(this.mock.$_convertToRedeemShares(epochId, 10n, 0n)).to.eventually.equal(20n);
          // Ceil: ceil(11 * 100 / 50) = 22
          await expect(this.mock.$_convertToRedeemShares(epochId, 11n, 1n)).to.eventually.equal(22n);
        });

        it('pending vs. claimable sentinel distinguishes states', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);

          // Pending state
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(100n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.pendingRedeemRequest(epochId, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableRedeemRequest(epochId, user)).to.eventually.equal(0n);

          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 42n);

          // Claimable state
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(100n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(42n);
          await expect(this.mock.pendingRedeemRequest(epochId, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableRedeemRequest(epochId, user)).to.eventually.equal(100n);

          // Consume the full claim
          await this.mock.connect(user).redeem(100n, user, user);

          // Fully-claimed (drained): totalShares and totalAssets both reach 0
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.pendingRedeemRequest(epochId, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableRedeemRequest(epochId, user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
        });
      });

      describe('_fulfillRedeem', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);
        });

        it('emits `ERC7540EpochRedeemFulfilled` with the locked rate', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);

          await expect(this.mock.$_fulfillRedeem(epochId, 42n))
            .to.emit(this.mock, 'ERC7540EpochRedeemFulfilled')
            .withArgs(epochId, 100n, 42n);
        });

        it('reverts `TooEarly` when the epoch is still the current one', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);

          await expect(this.mock.$_fulfillRedeem(epochId, 42n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochRedeemTooEarly')
            .withArgs(epochId);
        });

        it('reverts `EmptyEpoch` for an epoch with no requests', async function () {
          const current = await this.mock.currentRedeemEpoch();
          await advanceTo(current + 1n);

          await expect(this.mock.$_fulfillRedeem(current, 42n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochRedeemEmptyEpoch')
            .withArgs(current);
        });

        it('reverts `AlreadyFulfilled` on a second non-zero fulfill', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 42n);

          await expect(this.mock.$_fulfillRedeem(epochId, 50n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochRedeemAlreadyFulfilled')
            .withArgs(epochId);
        });

        it('a 0-asset fulfillment is a no-op and can be recovered by re-fulfilling', async function () {
          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);

          const totalAssets = await this.mock.totalAssets();
          const totalOutstandingShares = await this.mock.$_totalOutstandingShares();

          await expect(this.mock.$_fulfillRedeem(epochId, 0n)).to.not.emit(this.mock, 'ERC7540EpochRedeemFulfilled');

          // No side effect on the vault accounting
          await expect(this.mock.totalAssets()).to.eventually.equal(totalAssets);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(totalOutstandingShares);

          // State is still "pending" — sentinel hasn't tripped
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.pendingRedeemRequest(epochId, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableRedeemRequest(epochId, user)).to.eventually.equal(0n);

          await expect(this.mock.$_fulfillRedeem(epochId, 42n))
            .to.emit(this.mock, 'ERC7540EpochRedeemFulfilled')
            .withArgs(epochId, 100n, 42n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(42n);
          await expect(this.mock.claimableRedeemRequest(epochId, user)).to.eventually.equal(100n);

          // Only the real fulfillment settles the epoch in the vault accounting
          await expect(this.mock.totalAssets()).to.eventually.equal(totalAssets - 42n);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(totalOutstandingShares - 100n);
        });

        it('a 0-asset fulfillment skips the solvency check', async function () {
          const txA = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochA = await this.getRequestId(txA);
          await advanceTo(epochA + 1n);
          const txB = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochB = await this.getRequestId(txB);
          await advanceTo(epochB + 1n);

          // Commit all the vault's assets to epoch A, then lose some of them
          await this.mock.$_fulfillRedeem(epochA, 1000n);
          await this.token.$_burn(this.mock, 1n);

          await expect(this.mock.$_fulfillRedeem(epochB, 0n)).to.not.revert(ethers);
          await expect(this.mock.$_fulfillRedeem(epochB, 1n)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540InsufficientAssets',
          );
        });

        it('successive fulfillments cannot promise more assets than the vault holds', async function () {
          const txA = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochA = await this.getRequestId(txA);
          await advanceTo(epochA + 1n);
          const txB = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochB = await this.getRequestId(txB);
          await advanceTo(epochB + 1n);

          // Epoch A takes all the vault's assets: nothing is left for epoch B
          await this.mock.$_fulfillRedeem(epochA, 1000n);
          await expect(this.mock.$_fulfillRedeem(epochB, 1n)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540InsufficientAssets',
          );

          // Funding the vault allows the fulfillment
          await this.token.$_mint(this.mock, 1n);
          await this.mock.$_fulfillRedeem(epochB, 1n);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
        });

        it('reverts `InsufficientAssets` when the vault cannot cover pending deposits', async function () {
          await this.token.$_mint(user, 500n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
          await this.mock.connect(user).requestDeposit(500n, user, user);

          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);

          // The vault holds 1500 assets, 500 of which belong to the pending deposit
          await expect(this.mock.$_fulfillRedeem(epochId, 1001n)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540InsufficientAssets',
          );

          await expect(this.mock.$_fulfillRedeem(epochId, 1000n))
            .to.emit(this.mock, 'ERC7540EpochRedeemFulfilled')
            .withArgs(epochId, 100n, 1000n);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
        });
      });

      describe('solvency', function () {
        it('assets of claimable deposits can back redeems claimed before the deposit is claimed', async function () {
          const [, user, other] = await ethers.getSigners();
          await this.token.$_mint(user, 500n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
          await this.mock.$_mint(other, 500n);

          const tx = await this.mock.connect(user).requestDeposit(500n, user, user);
          await this.mock.connect(other).requestRedeem(500n, other, other);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);

          // The fulfilled deposit is settled: its assets back the redeem
          await this.mock.$_fulfillDeposit(epochId, 500n);
          await this.mock.$_fulfillRedeem(epochId, 500n);
          await this.mock.connect(other).redeem(500n, other, other);

          // The vault holds no assets while the claimable deposit is still unclaimed
          await expect(this.token.balanceOf(this.mock)).to.eventually.equal(0n);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(500n);

          await this.mock.connect(user).deposit(500n, user, ethers.Typed.address(user));
          await expect(this.mock.balanceOf(user)).to.eventually.equal(500n);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
        });
      });

      describe('multi-epoch flow', function () {
        it('a controller can hold requests across multiple epochs and claim each', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);

          const txA = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochA = await this.getRequestId(txA);

          await advanceTo(epochA + 1n);
          const txB = await this.mock.connect(user).requestRedeem(50n, user, user);
          const epochB = await this.getRequestId(txB);
          expect(epochB).to.equal(epochA + 1n);

          await advanceTo(epochB + 1n);
          await this.mock.$_fulfillRedeem(epochA, 200n); // 100 shares -> 200 assets
          await this.mock.$_fulfillRedeem(epochB, 50n); //  50 shares ->  50 assets

          await expect(this.mock.maxRedeem(user)).to.eventually.equal(150n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(250n);

          await this.mock.connect(user).withdraw(100n, user, user);
          await expect(this.token.balanceOf(user)).to.eventually.equal(100n);

          await this.mock.connect(user).withdraw(this.mock.maxWithdraw(user), user, user);
          await expect(this.token.balanceOf(user)).to.eventually.equal(250n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
        });

        it('multiple controllers in the same epoch share pro-rata', async function () {
          const [, alice, bob, carol] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          for (const u of [alice, bob, carol]) {
            await this.mock.$_mint(u, 1000n);
          }

          const txA = await this.mock.connect(alice).requestRedeem(30n, alice, alice);
          await this.mock.connect(bob).requestRedeem(40n, bob, bob);
          await this.mock.connect(carol).requestRedeem(30n, carol, carol);
          const epochId = await this.getRequestId(txA);

          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(100n);

          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 200n); // 100 -> 200, exact rate 1:2

          await expect(this.mock.maxWithdraw(alice)).to.eventually.equal(60n);
          await expect(this.mock.maxWithdraw(bob)).to.eventually.equal(80n);
          await expect(this.mock.maxWithdraw(carol)).to.eventually.equal(60n);

          await this.mock.connect(alice).redeem(30n, alice, alice);
          await this.mock.connect(bob).redeem(40n, bob, bob);
          await this.mock.connect(carol).redeem(30n, carol, carol);

          await expect(this.token.balanceOf(alice)).to.eventually.equal(60n);
          await expect(this.token.balanceOf(bob)).to.eventually.equal(80n);
          await expect(this.token.balanceOf(carol)).to.eventually.equal(60n);

          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(0n);
        });
      });

      describe('redeemEpochs', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 10000n);
          await this.mock.$_mint(user, 10000n);
        });

        it('returns empty for a controller with no requests', async function () {
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([]);
          await expect(this.mock.redeemEpochs(user, 0, 10)).to.eventually.deep.equal([]);
        });

        it('returns each epoch in queue order (oldest first)', async function () {
          const e0 = await this.mock.currentRedeemEpoch();
          await this.mock.connect(user).requestRedeem(100n, user, user);
          await advanceTo(e0 + 1n);
          await this.mock.connect(user).requestRedeem(100n, user, user);
          await advanceTo(e0 + 2n);
          await this.mock.connect(user).requestRedeem(100n, user, user);

          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([
            e0,
            e0 + 1n,
            e0 + 2n,
          ]);
        });

        it('collapses multiple requests in the same epoch into one entry', async function () {
          const e0 = await this.mock.currentRedeemEpoch();
          await this.mock.connect(user).requestRedeem(50n, user, user);
          await this.mock.connect(user).requestRedeem(50n, user, user);

          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0]);
        });

        it('pops fully-claimed epochs from the queue', async function () {
          const e0 = await this.mock.currentRedeemEpoch();
          await this.mock.connect(user).requestRedeem(100n, user, user);
          await advanceTo(e0 + 1n);
          await this.mock.connect(user).requestRedeem(100n, user, user);

          await advanceTo(e0 + 2n);
          await this.mock.$_fulfillRedeem(e0, 200n);
          await this.mock.$_fulfillRedeem(e0 + 1n, 200n);

          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0, e0 + 1n]);

          // Claim the first epoch fully — _consumeClaimableRedeem pops it from the queue
          await this.mock.connect(user).redeem(100n, user, user);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0 + 1n]);
        });

        it('paginates with [start, end)', async function () {
          const e0 = await this.mock.currentRedeemEpoch();
          for (let i = 0n; i < 4n; i++) {
            await advanceTo(e0 + i); // no-op for i = 0
            await this.mock.connect(user).requestRedeem(10n, user, user);
          }
          const all = [e0, e0 + 1n, e0 + 2n, e0 + 3n];

          await expect(this.mock.redeemEpochs(user, 0, 4)).to.eventually.deep.equal(all);
          await expect(this.mock.redeemEpochs(user, 1, 3)).to.eventually.deep.equal(all.slice(1, 3));
          await expect(this.mock.redeemEpochs(user, 0, 1)).to.eventually.deep.equal(all.slice(0, 1));
        });

        it('clamps out-of-bound `start` and `end`', async function () {
          const e0 = await this.mock.currentRedeemEpoch();
          await this.mock.connect(user).requestRedeem(100n, user, user);

          // end > length → clamped
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0]);
          // start > length → empty after both clamps
          await expect(this.mock.redeemEpochs(user, 10, ethers.MaxUint256)).to.eventually.deep.equal([]);
          // start > end → empty
          await expect(this.mock.redeemEpochs(user, 1, 0)).to.eventually.deep.equal([]);
        });
      });

      describe('queue limit', function () {
        it('enforces `_redeemRequestQueueLimit` per controller', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 10000n);
          await this.mock.$_mint(user, 10000n);

          // Fill the queue with 32 distinct epochs (default limit)
          const e0 = await this.mock.currentRedeemEpoch();
          for (let i = 0n; i < 32n; i++) {
            await advanceTo(e0 + i); // no-op for i = 0
            await this.mock.connect(user).requestRedeem(1n, user, user);
          }

          // The 33rd distinct epoch should revert with the queue-limit error
          await advanceTo(e0 + 32n);
          await expect(this.mock.connect(user).requestRedeem(1n, user, user))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochRedeemQueueLimitExceeded')
            .withArgs(user);
        });

        it('multiple requests in the same epoch share one queue slot', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);

          // Many requests in the same epoch - all share the same queue entry
          for (let i = 0; i < 50; i++) {
            await this.mock.connect(user).requestRedeem(1n, user, user);
          }
          // Did not hit the queue limit despite > 32 requests
          const epochId = await this.mock.currentRedeemEpoch();
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([epochId]);
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(50n);
        });

        it('a full queue only frees slots once its oldest epoch is fulfilled and claimed', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 10000n);
          await this.mock.$_mint(user, 10000n);

          // Fill the queue with 32 distinct epochs, the last one being the current epoch
          const e0 = await this.mock.currentRedeemEpoch();
          for (let i = 0n; i < 32n; i++) {
            await advanceTo(e0 + i); // no-op for i = 0
            await this.mock.connect(user).requestRedeem(1n, user, user);
          }

          // At the limit, the current (tail) epoch still accepts requests
          await this.mock.connect(user).requestRedeem(1n, user, user);
          await expect(this.mock.totalRedeemShares(e0 + 31n)).to.eventually.equal(2n);

          // A new epoch is rejected, except for zero-amount requests that don't take a slot
          await advanceTo(e0 + 32n);
          await expect(this.mock.connect(user).requestRedeem(1n, user, user))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochRedeemQueueLimitExceeded')
            .withArgs(user);
          await this.mock.connect(user).requestRedeem(0n, user, user);

          // Fulfilling a newer epoch while the oldest is Pending frees nothing
          await this.mock.$_fulfillRedeem(e0 + 1n, 1n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.connect(user).requestRedeem(1n, user, user)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540EpochRedeemQueueLimitExceeded',
          );

          // Once the oldest epoch is fulfilled, claiming pops both fulfilled epochs
          await this.mock.$_fulfillRedeem(e0, 1n);
          await this.mock.connect(user).redeem(2n, user, user);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256).then(e => e.length)).to.eventually.equal(30);

          await this.mock.connect(user).requestRedeem(1n, user, user);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256).then(e => e.length)).to.eventually.equal(31);
        });
      });

      describe('requestRedeem', function () {
        it('zero-amount `requestRedeem` is a no-op at the epoch layer', async function () {
          const [, user] = await ethers.getSigners();
          await this.mock.$_mint(user, 1000n);

          const epochId = await this.mock.currentRedeemEpoch();
          await expect(this.mock.connect(user).requestRedeem(0n, user, user))
            .to.emit(this.mock, 'RedeemRequest')
            .withArgs(user, user, epochId, user, 0n);

          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([]);
        });

        it('zero-amount `requestRedeem` still requires the caller to be the controller or its operator', async function () {
          const [, attacker, victim] = await ethers.getSigners();

          await expect(this.mock.connect(attacker).requestRedeem(0n, victim, attacker))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
            .withArgs(victim, attacker);
        });

        it('third-party attribution to a foreign controller reverts', async function () {
          const [, attacker, victim] = await ethers.getSigners();
          await this.mock.$_mint(attacker, 1000n);

          await expect(this.mock.connect(attacker).requestRedeem(1n, victim, attacker))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
            .withArgs(victim, attacker);
        });
      });

      describe('out-of-order fulfillment', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);
          this.epochA = await this.mock
            .connect(user)
            .requestRedeem(100n, user, user)
            .then(tx => this.getRequestId(tx));
          await advanceTo(this.epochA + 1n);
          this.epochB = await this.mock
            .connect(user)
            .requestRedeem(50n, user, user)
            .then(tx => this.getRequestId(tx));
          await advanceTo(this.epochB + 1n);
        });

        it('maxWithdraw / maxRedeem hide a fulfilled epoch when an older one is still Pending', async function () {
          await this.mock.$_fulfillRedeem(this.epochB, 100n); // out of order; B before A

          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);

          await expect(this.mock.pendingRedeemRequest(this.epochA, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableRedeemRequest(this.epochB, user)).to.eventually.equal(50n);
        });

        it('_consumeClaimableWithdraw is a no-op when the oldest epoch is Pending', async function () {
          await this.mock.$_fulfillRedeem(this.epochB, 100n);

          await this.mock.$_consumeClaimableWithdraw(999n, user);

          await expect(this.mock.totalRedeemShares(this.epochA)).to.eventually.equal(100n);
          await expect(this.mock.totalRedeemShares(this.epochB)).to.eventually.equal(50n);
          await expect(this.mock.totalRedeemAssets(this.epochB)).to.eventually.equal(100n);
          await expect(this.mock.pendingRedeemRequest(this.epochA, user)).to.eventually.equal(100n);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([
            this.epochA,
            this.epochB,
          ]);
        });

        it('_consumeClaimableRedeem is a no-op when the oldest epoch is Pending', async function () {
          await this.mock.$_fulfillRedeem(this.epochB, 100n);

          await this.mock.$_consumeClaimableRedeem(999n, user);

          await expect(this.mock.totalRedeemShares(this.epochA)).to.eventually.equal(100n);
          await expect(this.mock.totalRedeemShares(this.epochB)).to.eventually.equal(50n);
          await expect(this.mock.totalRedeemAssets(this.epochB)).to.eventually.equal(100n);
          await expect(this.mock.pendingRedeemRequest(this.epochA, user)).to.eventually.equal(100n);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([
            this.epochA,
            this.epochB,
          ]);
        });

        it('claims unlock automatically once the older epoch is fulfilled', async function () {
          await this.mock.$_fulfillRedeem(this.epochB, 100n); // B first
          await this.mock.$_fulfillRedeem(this.epochA, 200n); // then A

          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(300n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(150n);

          await this.mock.connect(user).redeem(150n, user, user);
          await expect(this.token.balanceOf(user)).to.eventually.equal(300n);
          await expect(this.mock.redeemEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([]);
        });
      });

      describe('edge cases', function () {
        it('share-driven claims can round to zero assets, to the benefit of later claimants', async function () {
          const [, alice, bob] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(alice, 1000n);
          await this.mock.$_mint(bob, 1000n);

          const tx = await this.mock.connect(alice).requestRedeem(100n, alice, alice);
          await this.mock.connect(bob).requestRedeem(100n, bob, bob);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 2n); // 200 shares -> 2 assets

          // floor(1 * 2 / 200) = 0: the claim consumes 1 share of Alice's request for no asset
          await this.mock.connect(alice).redeem(1n, alice, alice);
          await expect(this.token.balanceOf(alice)).to.eventually.equal(0n);
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(199n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(2n);

          // floor(99 * 2 / 199) = 0: Alice's remaining request is also worth no asset
          await this.mock.connect(alice).redeem(99n, alice, alice);
          await expect(this.token.balanceOf(alice)).to.eventually.equal(0n);

          // Bob, the last claimant, receives the remainder and drains the epoch
          await this.mock.connect(bob).redeem(100n, bob, bob);
          await expect(this.token.balanceOf(bob)).to.eventually.equal(2n);
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(0n);
        });

        it('asset-driven claim cannot exhaust `totalAssets` while `totalShares > 0` (H-02)', async function () {
          // Regression for audit H-02: with `_asyncMaxWithdraw` and `_consumeClaimableWithdraw`
          // both floor-rounding the per-epoch entitlement, an asset-driven claim cannot drive
          // `totalAssets` to the Pending sentinel while `totalShares` still holds a controller's
          // request. Setup mirrors the audit toy on the redeem side: r_alice=2, r_bob=1,
          // totalShares=3, A=2.
          const [, alice, bob] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          for (const u of [alice, bob]) {
            await this.mock.$_mint(u, 1000n);
          }

          const tx = await this.mock.connect(alice).requestRedeem(2n, alice, alice);
          await this.mock.connect(bob).requestRedeem(1n, bob, bob);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 2n);

          // Both sides use floor; Alice's per-epoch asset entitlement is 1, not 2.
          await expect(this.mock.maxWithdraw(alice)).to.eventually.equal(1n);

          await this.mock.$_consumeClaimableWithdraw(1n, alice);

          // Sentinel preserved: totalAssets stays > 0 while requests remain unclaimed.
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(1n);
          // Exhausting her entitlement consumes Alice's entire request: only Bob's remains.
          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(1n);
          await expect(this.mock.claimableRedeemRequest(epochId, alice)).to.eventually.equal(0n);

          // Bob's claim slot is still reachable — not frozen behind a dirty sentinel.
          await expect(this.mock.claimableRedeemRequest(epochId, bob)).to.eventually.equal(1n);
        });

        it('a fully-drained epoch keeps the {_fulfillRedeem} sentinel intact', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);

          const tx = await this.mock.connect(user).requestRedeem(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillRedeem(epochId, 42n);
          await this.mock.connect(user).redeem(100n, user, user);

          await expect(this.mock.totalRedeemShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalRedeemAssets(epochId)).to.eventually.equal(0n);

          await expect(this.mock.$_fulfillRedeem(epochId, 50n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochRedeemEmptyEpoch')
            .withArgs(epochId);
        });
      });
    });
  }
});
