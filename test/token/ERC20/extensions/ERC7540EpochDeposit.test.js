import { network } from 'hardhat';
import { expect } from 'chai';
import { shouldBehaveLikeERC7540Operator, shouldBehaveLikeERC7540Deposit } from './ERC7540.behavior';
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
// `currentDepositEpoch() = (block.timestamp + 3 days) / week`, so epoch `N` starts at Monday
// 00:00 UTC of that week (`t = N * week - 3 days`).
const MONDAY_OFFSET = 3n * 24n * 3600n;

// Advances time to the start of `epochId`, so that `currentDepositEpoch() >= epochId`. No-op if already there.
async function advanceTo(epochId) {
  const now = await time.clock.timestamp();
  const target = epochId * week - MONDAY_OFFSET;
  if (now < target) await time.increaseTo.timestamp(target);
}

describe('ERC7540EpochDeposit', function () {
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

        // Behavior-test plumbing: fulfill the whole epoch at the (assets, shares) rate.
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
          await expect(this.mock.currentDepositEpoch()).to.eventually.equal((now + MONDAY_OFFSET) / week);
        });
      });

      shouldBehaveLikeERC7540Operator();
      shouldBehaveLikeERC7540Deposit({ supportCustomFulfill: false, gateOnController: true });
      shouldBehaveLikeERC7575();

      describe('epoch state and getters', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
        });

        it('`requestDeposit` returns the current epoch as `requestId`', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const expected = ((await time.clockFromReceipt.timestamp(tx)) + MONDAY_OFFSET) / week;
          // requestId is also retrievable via the event (indexed third topic)
          await expect(tx).to.emit(this.mock, 'DepositRequest').withArgs(user, user, expected, user, 100n);
        });

        it('`_convertToDepositShares` returns 0 when `totalAssets == 0`', async function () {
          // unknown epoch -> totalAssets = 0
          await expect(this.mock.$_convertToDepositShares(999n, 100n, 0n)).to.eventually.equal(0n);
        });

        it('`_convertToDepositAssets` returns 0 when `totalShares == 0`', async function () {
          // pending epoch -> totalShares = 0
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await expect(this.mock.$_convertToDepositAssets(epochId, 50n, 0n)).to.eventually.equal(0n);
        });

        it('`_convertToDepositShares` applies the locked rate', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 50n); // rate 1 asset = 0.5 shares

          // Floor: floor(40 * 50 / 100) = 20
          await expect(this.mock.$_convertToDepositShares(epochId, 40n, 0n)).to.eventually.equal(20n);
          // Ceil: ceil(33 * 50 / 100) = 17
          await expect(this.mock.$_convertToDepositShares(epochId, 33n, 1n)).to.eventually.equal(17n);
        });

        it('`_convertToDepositAssets` applies the locked rate', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 50n);

          // Floor: floor(10 * 100 / 50) = 20
          await expect(this.mock.$_convertToDepositAssets(epochId, 10n, 0n)).to.eventually.equal(20n);
          // Ceil: ceil(11 * 100 / 50) = 22
          await expect(this.mock.$_convertToDepositAssets(epochId, 11n, 1n)).to.eventually.equal(22n);
        });

        it('pending vs. claimable sentinel distinguishes states', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);

          // Pending state
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(100n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.pendingDepositRequest(epochId, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableDepositRequest(epochId, user)).to.eventually.equal(0n);

          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 42n);

          // Claimable state
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(100n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(42n);
          await expect(this.mock.pendingDepositRequest(epochId, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableDepositRequest(epochId, user)).to.eventually.equal(100n);

          // Consume the full claim
          await this.mock.connect(user).deposit(100n, user, ethers.Typed.address(user));

          // Fully-claimed (drained): totalAssets and totalShares both reach 0
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.pendingDepositRequest(epochId, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableDepositRequest(epochId, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
        });
      });

      describe('_fulfillDeposit', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
        });

        it('emits `ERC7540EpochDepositFulfilled` with the locked rate', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);

          await expect(this.mock.$_fulfillDeposit(epochId, 42n))
            .to.emit(this.mock, 'ERC7540EpochDepositFulfilled')
            .withArgs(epochId, 100n, 42n);
        });

        it('reverts `TooEarly` when the epoch is still the current one', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          // Do NOT advance time — epochId == currentDepositEpoch()

          await expect(this.mock.$_fulfillDeposit(epochId, 42n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochDepositTooEarly')
            .withArgs(epochId);
        });

        it('reverts `EmptyEpoch` for an epoch with no requests', async function () {
          const current = await this.mock.currentDepositEpoch();
          await advanceTo(current + 1n);

          await expect(this.mock.$_fulfillDeposit(current, 42n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochDepositEmptyEpoch')
            .withArgs(current);
        });

        it('reverts `AlreadyFulfilled` on a second non-zero fulfill', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 42n);

          await expect(this.mock.$_fulfillDeposit(epochId, 50n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochDepositAlreadyFulfilled')
            .withArgs(epochId);
        });

        // Documents the assumption baked into the sentinel: admin fulfilling at 0 is a no-op,
        // not a permanent confiscation. The admin can retry with the correct value.
        it('a 0-share fulfillment is a no-op and can be recovered by re-fulfilling', async function () {
          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);

          const totalAssets = await this.mock.totalAssets();
          const totalOutstandingShares = await this.mock.$_totalOutstandingShares();

          await expect(this.mock.$_fulfillDeposit(epochId, 0n)).to.not.emit(this.mock, 'ERC7540EpochDepositFulfilled');

          // No side effect on the vault accounting
          await expect(this.mock.totalAssets()).to.eventually.equal(totalAssets);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(totalOutstandingShares);

          // State is still "pending" — sentinel hasn't tripped
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(0n);
          await expect(this.mock.pendingDepositRequest(epochId, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableDepositRequest(epochId, user)).to.eventually.equal(0n);

          // Re-fulfill with the correct value
          await expect(this.mock.$_fulfillDeposit(epochId, 42n))
            .to.emit(this.mock, 'ERC7540EpochDepositFulfilled')
            .withArgs(epochId, 100n, 42n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(42n);
          await expect(this.mock.claimableDepositRequest(epochId, user)).to.eventually.equal(100n);

          // Only the real fulfillment settles the epoch in the vault accounting
          await expect(this.mock.totalAssets()).to.eventually.equal(totalAssets + 100n);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(totalOutstandingShares + 42n);
        });
      });

      describe('multi-epoch flow', function () {
        it('a controller can hold requests across multiple epochs and claim each', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          // Epoch A
          const txA = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochA = await this.getRequestId(txA);

          // Advance one week -> Epoch B
          await advanceTo(epochA + 1n);
          const txB = await this.mock.connect(user).requestDeposit(50n, user, user);
          const epochB = await this.getRequestId(txB);
          expect(epochB).to.equal(epochA + 1n);

          // Advance and fulfill both
          await advanceTo(epochB + 1n);
          await this.mock.$_fulfillDeposit(epochA, 200n); // 100 assets -> 200 shares
          await this.mock.$_fulfillDeposit(epochB, 50n); //  50 assets ->  50 shares

          await expect(this.mock.maxDeposit(user)).to.eventually.equal(150n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(250n);

          // Claim 50 shares - hits epochA (front of queue) only
          await this.mock.connect(user).mint(50n, user, ethers.Typed.address(user));
          await expect(this.mock.balanceOf(user)).to.eventually.equal(50n);

          // Claim the rest - drains epochA then takes from epochB
          await this.mock.connect(user).mint(this.mock.maxMint(user), user, ethers.Typed.address(user));
          await expect(this.mock.balanceOf(user)).to.eventually.equal(250n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
        });

        it('multiple controllers in the same epoch share pro-rata', async function () {
          const [, alice, bob, carol] = await ethers.getSigners();
          for (const user of [alice, bob, carol]) {
            await this.token.$_mint(user, 1000n);
            await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
          }

          const txA = await this.mock.connect(alice).requestDeposit(30n, alice, alice);
          await this.mock.connect(bob).requestDeposit(40n, bob, bob);
          await this.mock.connect(carol).requestDeposit(30n, carol, carol);
          const epochId = await this.getRequestId(txA);

          // Total assets pending in this epoch
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(100n);

          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 200n); // 100 -> 200, exact rate 1:2

          // Each controller can mint their pro-rata share
          await expect(this.mock.maxMint(alice)).to.eventually.equal(60n);
          await expect(this.mock.maxMint(bob)).to.eventually.equal(80n);
          await expect(this.mock.maxMint(carol)).to.eventually.equal(60n);

          // Claim in order — each pops their queue entry without affecting the others
          await this.mock.connect(alice).deposit(30n, alice, ethers.Typed.address(alice));
          await this.mock.connect(bob).deposit(40n, bob, ethers.Typed.address(bob));
          await this.mock.connect(carol).deposit(30n, carol, ethers.Typed.address(carol));

          await expect(this.mock.balanceOf(alice)).to.eventually.equal(60n);
          await expect(this.mock.balanceOf(bob)).to.eventually.equal(80n);
          await expect(this.mock.balanceOf(carol)).to.eventually.equal(60n);

          // Epoch fully drained
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(0n);
        });
      });

      describe('depositEpochs', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 10000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
        });

        it('returns empty for a controller with no requests', async function () {
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([]);
          await expect(this.mock.depositEpochs(user, 0, 10)).to.eventually.deep.equal([]);
        });

        it('returns each epoch in queue order (oldest first)', async function () {
          const e0 = await this.mock.currentDepositEpoch();
          await this.mock.connect(user).requestDeposit(100n, user, user);
          await advanceTo(e0 + 1n);
          await this.mock.connect(user).requestDeposit(100n, user, user);
          await advanceTo(e0 + 2n);
          await this.mock.connect(user).requestDeposit(100n, user, user);

          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([
            e0,
            e0 + 1n,
            e0 + 2n,
          ]);
        });

        it('collapses multiple requests in the same epoch into one entry', async function () {
          const e0 = await this.mock.currentDepositEpoch();
          await this.mock.connect(user).requestDeposit(50n, user, user);
          await this.mock.connect(user).requestDeposit(50n, user, user);

          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0]);
        });

        it('pops fully-claimed epochs from the queue', async function () {
          const e0 = await this.mock.currentDepositEpoch();
          await this.mock.connect(user).requestDeposit(100n, user, user);
          await advanceTo(e0 + 1n);
          await this.mock.connect(user).requestDeposit(100n, user, user);

          await advanceTo(e0 + 2n);
          await this.mock.$_fulfillDeposit(e0, 50n);
          await this.mock.$_fulfillDeposit(e0 + 1n, 50n);

          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0, e0 + 1n]);

          // Claim the first epoch fully — _consumeClaimableDeposit pops it from the queue
          await this.mock.connect(user).deposit(100n, user, ethers.Typed.address(user));
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0 + 1n]);
        });

        it('paginates with [start, end)', async function () {
          const e0 = await this.mock.currentDepositEpoch();
          for (let i = 0n; i < 4n; i++) {
            await advanceTo(e0 + i); // no-op for i = 0
            await this.mock.connect(user).requestDeposit(10n, user, user);
          }
          const all = [e0, e0 + 1n, e0 + 2n, e0 + 3n];

          await expect(this.mock.depositEpochs(user, 0, 4)).to.eventually.deep.equal(all);
          await expect(this.mock.depositEpochs(user, 1, 3)).to.eventually.deep.equal(all.slice(1, 3));
          await expect(this.mock.depositEpochs(user, 0, 1)).to.eventually.deep.equal(all.slice(0, 1));
        });

        it('clamps out-of-bound `start` and `end`', async function () {
          const e0 = await this.mock.currentDepositEpoch();
          await this.mock.connect(user).requestDeposit(100n, user, user);

          // end > length → clamped
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([e0]);
          // start > length → empty after both clamps
          await expect(this.mock.depositEpochs(user, 10, ethers.MaxUint256)).to.eventually.deep.equal([]);
          // start > end → empty
          await expect(this.mock.depositEpochs(user, 1, 0)).to.eventually.deep.equal([]);
        });
      });

      describe('queue limit', function () {
        it('enforces `_depositRequestQueueLimit` per controller', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 10000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          // Fill the queue with 32 distinct epochs (default limit)
          const e0 = await this.mock.currentDepositEpoch();
          for (let i = 0n; i < 32n; i++) {
            await advanceTo(e0 + i); // no-op for i = 0
            await this.mock.connect(user).requestDeposit(1n, user, user);
          }

          // The 33rd distinct epoch should revert with the queue-limit error
          await advanceTo(e0 + 32n);
          await expect(this.mock.connect(user).requestDeposit(1n, user, user))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochDepositQueueLimitExceeded')
            .withArgs(user);
        });

        it('multiple requests in the same epoch share one queue slot', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          // Many requests in the same epoch - all share the same queue entry
          for (let i = 0; i < 50; i++) {
            await this.mock.connect(user).requestDeposit(1n, user, user);
          }
          // Did not hit the queue limit despite > 32 requests
          const epochId = await this.mock.currentDepositEpoch();
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([epochId]);
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(50n);
        });

        it('a full queue only frees slots once its oldest epoch is fulfilled and claimed', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 10000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          // Fill the queue with 32 distinct epochs, the last one being the current epoch
          const e0 = await this.mock.currentDepositEpoch();
          for (let i = 0n; i < 32n; i++) {
            await advanceTo(e0 + i); // no-op for i = 0
            await this.mock.connect(user).requestDeposit(1n, user, user);
          }

          // At the limit, the current (tail) epoch still accepts requests
          await this.mock.connect(user).requestDeposit(1n, user, user);
          await expect(this.mock.totalDepositAssets(e0 + 31n)).to.eventually.equal(2n);

          // A new epoch is rejected, except for zero-amount requests that don't take a slot
          await advanceTo(e0 + 32n);
          await expect(this.mock.connect(user).requestDeposit(1n, user, user))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochDepositQueueLimitExceeded')
            .withArgs(user);
          await this.mock.connect(user).requestDeposit(0n, user, user);

          // Fulfilling a newer epoch while the oldest is Pending frees nothing
          await this.mock.$_fulfillDeposit(e0 + 1n, 1n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.connect(user).requestDeposit(1n, user, user)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540EpochDepositQueueLimitExceeded',
          );

          // Once the oldest epoch is fulfilled, claiming pops both fulfilled epochs
          await this.mock.$_fulfillDeposit(e0, 1n);
          await this.mock.connect(user).deposit(2n, user, ethers.Typed.address(user));
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256).then(e => e.length)).to.eventually.equal(30);

          await this.mock.connect(user).requestDeposit(1n, user, user);
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256).then(e => e.length)).to.eventually.equal(31);
        });
      });

      describe('requestDeposit', function () {
        it('zero-amount `requestDeposit` is a no-op at the epoch layer', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          const epochId = await this.mock.currentDepositEpoch();
          await expect(this.mock.connect(user).requestDeposit(0n, user, user))
            .to.emit(this.mock, 'DepositRequest')
            .withArgs(user, user, epochId, user, 0n);

          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([]);
        });

        it('zero-amount `requestDeposit` still requires the caller to be the controller or its operator', async function () {
          const [, attacker, victim] = await ethers.getSigners();

          await expect(this.mock.connect(attacker).requestDeposit(0n, victim, attacker))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
            .withArgs(victim, attacker);
        });

        it('third-party attribution to a foreign controller reverts', async function () {
          const [, attacker, victim] = await ethers.getSigners();
          await this.token.$_mint(attacker, 1000n);
          await this.token.connect(attacker).approve(this.mock, ethers.MaxUint256);

          await expect(this.mock.connect(attacker).requestDeposit(1n, victim, attacker))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540InvalidOperator')
            .withArgs(victim, attacker);
        });
      });

      describe('out-of-order fulfillment', function () {
        let user;

        beforeEach(async function () {
          [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
          this.epochA = await this.mock
            .connect(user)
            .requestDeposit(100n, user, user)
            .then(tx => this.getRequestId(tx));
          await advanceTo(this.epochA + 1n);
          this.epochB = await this.mock
            .connect(user)
            .requestDeposit(50n, user, user)
            .then(tx => this.getRequestId(tx));
          await advanceTo(this.epochB + 1n);
        });

        it('maxDeposit / maxMint hide a fulfilled epoch when an older one is still Pending', async function () {
          await this.mock.$_fulfillDeposit(this.epochB, 100n); // out of order; B before A

          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);

          await expect(this.mock.pendingDepositRequest(this.epochA, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableDepositRequest(this.epochB, user)).to.eventually.equal(50n);
        });

        it('_consumeClaimableDeposit is a no-op when the oldest epoch is Pending', async function () {
          await this.mock.$_fulfillDeposit(this.epochB, 100n);

          await this.mock.$_consumeClaimableDeposit(999n, user);

          await expect(this.mock.totalDepositAssets(this.epochA)).to.eventually.equal(100n);
          await expect(this.mock.totalDepositAssets(this.epochB)).to.eventually.equal(50n);
          await expect(this.mock.totalDepositShares(this.epochB)).to.eventually.equal(100n);
          await expect(this.mock.pendingDepositRequest(this.epochA, user)).to.eventually.equal(100n);
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([
            this.epochA,
            this.epochB,
          ]);
        });

        it('_consumeClaimableMint is a no-op when the oldest epoch is Pending', async function () {
          await this.mock.$_fulfillDeposit(this.epochB, 100n);

          await this.mock.$_consumeClaimableMint(999n, user);

          await expect(this.mock.totalDepositAssets(this.epochA)).to.eventually.equal(100n);
          await expect(this.mock.totalDepositAssets(this.epochB)).to.eventually.equal(50n);
          await expect(this.mock.totalDepositShares(this.epochB)).to.eventually.equal(100n);
          await expect(this.mock.pendingDepositRequest(this.epochA, user)).to.eventually.equal(100n);
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([
            this.epochA,
            this.epochB,
          ]);
        });

        it('claims unlock automatically once the older epoch is fulfilled', async function () {
          await this.mock.$_fulfillDeposit(this.epochB, 100n); // B first
          await this.mock.$_fulfillDeposit(this.epochA, 200n); // then A

          await expect(this.mock.maxDeposit(user)).to.eventually.equal(150n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(300n);

          // A single deposit call drains both epochs in queue order
          await this.mock.connect(user).deposit(150n, user, ethers.Typed.address(user));
          await expect(this.mock.balanceOf(user)).to.eventually.equal(300n);
          await expect(this.mock.depositEpochs(user, 0, ethers.MaxUint256)).to.eventually.deep.equal([]);
        });
      });

      describe('edge cases', function () {
        it('asset-driven claims can round to zero shares, to the benefit of later claimants', async function () {
          const [, alice, bob] = await ethers.getSigners();
          for (const u of [alice, bob]) {
            await this.token.$_mint(u, 1000n);
            await this.token.connect(u).approve(this.mock, ethers.MaxUint256);
          }

          const tx = await this.mock.connect(alice).requestDeposit(100n, alice, alice);
          await this.mock.connect(bob).requestDeposit(100n, bob, bob);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 2n); // 200 assets -> 2 shares

          // floor(1 * 2 / 200) = 0: the claim consumes 1 asset of Alice's request for no share
          await this.mock.connect(alice).deposit(1n, alice, ethers.Typed.address(alice));
          await expect(this.mock.balanceOf(alice)).to.eventually.equal(0n);
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(199n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(2n);

          // floor(99 * 2 / 199) = 0: Alice's remaining request is also worth no share
          await this.mock.connect(alice).deposit(99n, alice, ethers.Typed.address(alice));
          await expect(this.mock.balanceOf(alice)).to.eventually.equal(0n);

          // Bob, the last claimant, receives the remainder and drains the epoch
          await this.mock.connect(bob).deposit(100n, bob, ethers.Typed.address(bob));
          await expect(this.mock.balanceOf(bob)).to.eventually.equal(2n);
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(0n);
        });

        it('share-driven claim cannot exhaust `totalShares` while `totalAssets > 0` (H-02)', async function () {
          // Regression for audit H-02: with `_asyncMaxMint` and `_consumeClaimableMint` both
          // floor-rounding the per-epoch entitlement, a share-driven claim cannot drive
          // `totalShares` to the Pending sentinel while `totalAssets` still holds a controller's
          // request. Setup mirrors the audit toy: r_alice=2, r_bob=1, totalAssets=3, S=2.
          const [, alice, bob] = await ethers.getSigners();
          for (const u of [alice, bob]) {
            await this.token.$_mint(u, 1000n);
            await this.token.connect(u).approve(this.mock, ethers.MaxUint256);
          }

          const tx = await this.mock.connect(alice).requestDeposit(2n, alice, alice);
          await this.mock.connect(bob).requestDeposit(1n, bob, bob);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 2n);

          // Both sides use floor; Alice's per-epoch share entitlement is 1, not 2.
          await expect(this.mock.maxMint(alice)).to.eventually.equal(1n);

          await this.mock.$_consumeClaimableMint(1n, alice);

          // Sentinel preserved: totalShares stays > 0 while requests remain unclaimed.
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(1n);
          // Exhausting her entitlement consumes Alice's entire request: only Bob's remains.
          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(1n);
          await expect(this.mock.claimableDepositRequest(epochId, alice)).to.eventually.equal(0n);

          // Bob's claim slot is still reachable — not frozen behind a dirty sentinel.
          await expect(this.mock.claimableDepositRequest(epochId, bob)).to.eventually.equal(1n);
        });

        it('a fully-drained epoch keeps the {_fulfillDeposit} sentinel intact', async function () {
          // After a normal full distribution, `totalAssets` and `totalShares` both reach 0.
          // The sentinel relies on `totalAssets > 0` to detect "still has pending value", so
          // a re-fulfill attempt must revert with `EmptyEpoch` rather than silently re-trigger.
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          const tx = await this.mock.connect(user).requestDeposit(100n, user, user);
          const epochId = await this.getRequestId(tx);
          await advanceTo(epochId + 1n);
          await this.mock.$_fulfillDeposit(epochId, 42n);
          await this.mock.connect(user).deposit(100n, user, ethers.Typed.address(user));

          await expect(this.mock.totalDepositAssets(epochId)).to.eventually.equal(0n);
          await expect(this.mock.totalDepositShares(epochId)).to.eventually.equal(0n);

          await expect(this.mock.$_fulfillDeposit(epochId, 50n))
            .to.be.revertedWithCustomError(this.mock, 'ERC7540EpochDepositEmptyEpoch')
            .withArgs(epochId);
        });
      });
    });
  }
});
