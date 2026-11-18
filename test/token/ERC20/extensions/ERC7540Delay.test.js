import { network } from 'hardhat';
import { expect } from 'chai';
import {
  shouldBehaveLikeERC7540Operator,
  shouldBehaveLikeERC7540Deposit,
  shouldBehaveLikeERC7540Redeem,
} from './ERC7540.behavior';
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
const delay = 3600n;

async function fixture() {
  const token = await ethers.deployContract('$ERC20', [tokenName, tokenSymbol]);
  const mock = await ethers.deployContract('$ERC7540DelayMock', [name, symbol, token]);
  return { token, mock };
}

describe('ERC7540Delay', function () {
  before(function () {
    this.ethers = ethers;
  });

  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));

    this.getRequestId = tx => time.clockFromReceipt.timestamp(tx).then(timestamp => timestamp + delay);
    this.fulfillDeposit = requestId => time.increaseTo.timestamp(requestId);
    this.fulfillRedeem = requestId => time.increaseTo.timestamp(requestId);
  });

  describe('sanity', function () {
    it('construction revert if share origin is not address(0)', async function () {
      const factory = await ethers.getContractFactory('$ERC7540DelayShareOriginMock');
      await expect(
        ethers.deployContract('$ERC7540DelayShareOriginMock', [name, symbol, this.token]),
      ).to.be.revertedWithCustomError(factory, 'ERC7540DelayInvalidDepositShareOrigin');
    });

    it('construction revert if share destination is not address(0)', async function () {
      const factory = await ethers.getContractFactory('$ERC7540DelayShareDestinationMock');
      await expect(
        ethers.deployContract('$ERC7540DelayShareDestinationMock', [name, symbol, this.token]),
      ).to.be.revertedWithCustomError(factory, 'ERC7540DelayInvalidRedeemShareDestination');
    });
  });

  describe('metadata', function () {
    it('token', async function () {
      await expect(this.mock.asset()).to.eventually.equal(this.token);
      await expect(this.mock.vault(this.token)).to.eventually.equal(this.mock);
      await expect(this.mock.vault(this.mock)).to.eventually.equal(ethers.ZeroAddress);
    });

    it('name, symbol, decimals', async function () {
      await expect(this.mock.name()).to.eventually.equal(name);
      await expect(this.mock.symbol()).to.eventually.equal(symbol);
      await expect(this.mock.decimals()).to.eventually.equal(18n);
    });

    it('reports default delay', async function () {
      await expect(this.mock.depositDelay(ethers.ZeroAddress)).to.eventually.equal(delay);
      await expect(this.mock.redeemDelay(ethers.ZeroAddress)).to.eventually.equal(delay);
    });

    it('reports async deposit and redeem', async function () {
      await expect(this.mock.$_isDepositAsync()).to.eventually.equal(true);
      await expect(this.mock.$_isRedeemAsync()).to.eventually.equal(true);
    });
  });

  shouldBehaveLikeERC7540Operator();
  shouldBehaveLikeERC7540Deposit({ supportCustomFulfill: false, settleOnFulfill: false });
  shouldBehaveLikeERC7540Redeem({ supportCustomFulfill: false, settleOnFulfill: false });
  shouldBehaveLikeERC7575();

  describe('reentrancy', function () {
    it('a pre-transfer hook in requestDeposit cannot claim at a depressed rate', async function () {
      const [seeder, attacker] = await ethers.getSigners();
      const token = await ethers.deployContract('$ERC20Reentrant');
      const mock = await ethers.deployContract('$ERC7540DelayMock', [name, symbol, token]);

      await token.$_mint(seeder, 1000n);
      await token.$_mint(attacker, 1000n);
      await token.connect(seeder).approve(mock, ethers.MaxUint256);
      await token.connect(attacker).approve(mock, ethers.MaxUint256);

      // 1,000 active assets backing 1,000 shares
      await mock.connect(seeder).requestDeposit(1000n, seeder, seeder);
      // attacker's 100-asset request, matured alongside the seeder's
      await mock.connect(attacker).requestDeposit(100n, attacker, attacker);
      await time.increaseBy.timestamp(delay);
      await mock.connect(seeder).getFunction('deposit(uint256,address,address)')(1000n, seeder, seeder);

      await expect(mock.totalAssets()).to.eventually.equal(1000n);
      await expect(mock.totalSupply()).to.eventually.equal(1000n);
      await expect(mock.maxMint(attacker)).to.eventually.equal(100n);

      // the token (reentry caller) acts as the attacker's operator
      await mock.connect(attacker).setOperator(token, true);
      await token.scheduleReenter(
        0x01, // Before
        mock,
        mock.interface.encodeFunctionData('deposit(uint256,address,address)', [
          100n,
          attacker.address,
          attacker.address,
        ]),
      );

      await mock.connect(attacker).requestDeposit(900n, attacker, attacker);

      // the reentrant claim was priced at the settled rate
      await expect(mock.balanceOf(attacker)).to.eventually.equal(100n);
      await expect(mock.totalAssets()).to.eventually.equal(1100n);
      await expect(mock.totalSupply()).to.eventually.equal(1100n);
      await expect(mock.totalPendingDepositAssets()).to.eventually.equal(900n);
    });
  });

  describe('multiple requests and partial claims', function () {
    it('deposit flow', async function () {
      const expectPendingClaimable = (requestId, account, pending, claimable) =>
        Promise.all([
          expect(this.mock.pendingDepositRequest(requestId, user)).to.eventually.equal(pending),
          expect(this.mock.claimableDepositRequest(requestId, user)).to.eventually.equal(claimable),
        ]);

      const [user] = await ethers.getSigners();
      await this.token.$_mint(user, 1000n);
      await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

      const timepoint = (await time.clock.timestamp()) + 100n;

      await expectPendingClaimable(timepoint + delay, user, 0n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 0n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);

      await time.increaseTo.timestamp(timepoint, false);
      await this.mock.connect(user).requestDeposit(100n, user, user);

      await expectPendingClaimable(timepoint + delay, user, 100n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 0n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);

      await time.increaseTo.timestamp(timepoint + 10n, false);
      await this.mock.connect(user).requestDeposit(200n, user, user);

      await expectPendingClaimable(timepoint + delay, user, 100n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 200n, 0n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);

      await time.increaseTo.timestamp(timepoint + delay);

      await expectPendingClaimable(timepoint + delay, user, 0n, 100n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 200n, 0n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(100n);

      await this.mock.deposit(50n, user);

      await expectPendingClaimable(timepoint + delay, user, 0n, 50n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 200n, 0n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(50n);

      await time.increaseTo.timestamp(timepoint + delay + 10n);

      await expectPendingClaimable(timepoint + delay, user, 0n, 50n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 200n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(250n);

      await this.mock.deposit(100n, user);

      await expectPendingClaimable(timepoint + delay, user, 0n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 150n);
      await expect(this.mock.maxDeposit(user)).to.eventually.equal(150n);
    });

    it('redeem flow', async function () {
      const expectPendingClaimable = (requestId, account, pending, claimable) =>
        Promise.all([
          expect(this.mock.pendingRedeemRequest(requestId, user)).to.eventually.equal(pending),
          expect(this.mock.claimableRedeemRequest(requestId, user)).to.eventually.equal(claimable),
        ]);

      const [user] = await ethers.getSigners();
      await this.token.$_mint(this.mock, 1000n);
      await this.mock.$_mint(user, 1000n);

      const timepoint = (await time.clock.timestamp()) + 100n;

      await expectPendingClaimable(timepoint + delay, user, 0n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 0n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);

      await time.increaseTo.timestamp(timepoint, false);
      await this.mock.connect(user).requestRedeem(100n, user, user);

      await expectPendingClaimable(timepoint + delay, user, 100n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 0n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);

      await time.increaseTo.timestamp(timepoint + 10n, false);
      await this.mock.connect(user).requestRedeem(200n, user, user);

      await expectPendingClaimable(timepoint + delay, user, 100n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 200n, 0n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);

      await time.increaseTo.timestamp(timepoint + delay);

      await expectPendingClaimable(timepoint + delay, user, 0n, 100n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 200n, 0n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(100n);

      await this.mock.redeem(50n, user, user);

      await expectPendingClaimable(timepoint + delay, user, 0n, 50n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 200n, 0n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(50n);

      await time.increaseTo.timestamp(timepoint + delay + 10n);

      await expectPendingClaimable(timepoint + delay, user, 0n, 50n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 200n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(250n);

      await this.mock.redeem(100n, user, user);

      await expectPendingClaimable(timepoint + delay, user, 0n, 0n);
      await expectPendingClaimable(timepoint + delay + 10n, user, 0n, 150n);
      await expect(this.mock.maxRedeem(user)).to.eventually.equal(150n);
    });
  });

  describe('partial claims at the live rate', function () {
    beforeEach(async function () {
      [this.user, this.other] = await ethers.getSigners();

      // 4 active assets backing 2 shares
      await this.token.$_mint(this.mock, 4n);
      await this.mock.$_mint(this.other, 2n);

      await this.token.$_mint(this.user, 3n);
      await this.token.connect(this.user).approve(this.mock, ethers.MaxUint256);
      await this.mock.connect(this.user).requestDeposit(3n, this.user, this.user);
      await time.increaseBy.timestamp(delay);
    });

    it('deposit converts the claimed assets directly', async function () {
      // maxMint is floor(3 * 3 / 5) = 1 and convertToShares(2) is floor(2 * 3 / 5) = 1
      await expect(this.mock.maxMint(this.user)).to.eventually.equal(1n);
      await expect(this.mock.convertToShares(2n)).to.eventually.equal(1n);

      await expect(
        this.mock.connect(this.user).getFunction('deposit(uint256,address,address)')(2n, this.user, this.user),
      ).to.changeTokenBalance(ethers, this.mock, this.user, 1n);
    });

    it('splitting a deposit claim mints as many shares as a single claim', async function () {
      const claim = this.mock.connect(this.user).getFunction('deposit(uint256,address,address)');
      await claim(2n, this.user, this.user);
      await claim(1n, this.user, this.user);

      await expect(this.mock.balanceOf(this.user)).to.eventually.equal(1n);
      await expect(this.mock.maxDeposit(this.user)).to.eventually.equal(0n);
    });
  });

  describe('capped claims', function () {
    const cap = 400n;
    const amount = 1000n;

    before(async function () {
      [this.alice, this.bob] = await ethers.getSigners();
      this.forAllUser = (fn, users = [this.alice, this.bob]) => Promise.all(users.map(user => fn(user)));
    });

    // claims `getMax()` with `claim` until nothing is left, checking that each claim stays within `limit`
    async function claimAll(getMax, claim, limit = cap) {
      for (let max = await getMax(); max > 0n; max = await getMax()) {
        expect(max).to.be.lte(limit);
        await claim(max);
      }
    }

    // alice and bob claim their deposits (in capped steps), then alice requests to redeem all her shares and waits for it to mature
    async function claimDepositsAndRequestRedeem() {
      await this.forAllUser(user =>
        claimAll(
          () => this.mock.maxDeposit(user),
          max => this.mock.connect(user).deposit(max, user, ethers.Typed.address(user)),
        ),
      );
      await expect(this.token.balanceOf(this.alice)).to.eventually.equal(0n);
      await expect(this.mock.balanceOf(this.alice)).to.eventually.equal(amount);

      await this.mock.connect(this.alice).requestRedeem(amount, this.alice, this.alice);
      await time.increaseBy.timestamp(delay);
    }

    // `capDerivedLimits`: whether the cap also applies to maxMint and maxWithdraw (derived from the capped hooks)
    for (const { title, contract, capDerivedLimits } of [
      { title: 'through the async hooks', contract: '$ERC7540DelayCappedHooksMock', capDerivedLimits: true },
      { title: 'through the public views', contract: '$ERC7540DelayCappedViewsMock', capDerivedLimits: false },
    ]) {
      describe(title, function () {
        beforeEach(async function () {
          this.mock = await ethers.deployContract(contract, [name, symbol, this.token]);
          await this.forAllUser(async user => {
            await this.token.$_mint(user, amount);
            await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
            await this.mock.connect(user).requestDeposit(amount, user, user);
          });
          await time.increaseBy.timestamp(delay);
        });

        it('deposit(maxDeposit) respects the deposit cap', async function () {
          // check: maxDeposit is capped, and depositing above it reverts
          await expect(this.mock.maxDeposit(this.alice)).to.eventually.equal(cap);
          await expect(this.mock.connect(this.alice).deposit(cap + 1n, this.alice, ethers.Typed.address(this.alice)))
            .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxDeposit')
            .withArgs(this.alice, cap + 1n, cap);

          // action: claim with deposit(maxDeposit) until nothing is left, each call staying within the cap
          await claimAll(
            () => this.mock.maxDeposit(this.alice),
            max => this.mock.connect(this.alice).deposit(max, this.alice, ethers.Typed.address(this.alice)),
          );

          // expect: alice received exactly her entitlement
          await expect(this.mock.balanceOf(this.alice)).to.eventually.equal(amount);
        });

        capDerivedLimits
          ? it('mint(maxMint) respects the deposit cap', async function () {
              // check: maxMint is derived from the capped _asyncMaxDeposit, and minting above it reverts
              await expect(this.mock.maxMint(this.alice)).to.eventually.equal(cap);
              await expect(this.mock.connect(this.alice).mint(cap + 1n, this.alice, ethers.Typed.address(this.alice)))
                .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxMint')
                .withArgs(this.alice, cap + 1n, cap);

              // action: claim with mint(maxMint) until nothing is left, each call staying within the cap
              await claimAll(
                () => this.mock.maxMint(this.alice),
                max => this.mock.connect(this.alice).mint(max, this.alice, ethers.Typed.address(this.alice)),
              );

              // expect: alice received exactly her entitlement
              await expect(this.mock.balanceOf(this.alice)).to.eventually.equal(amount);
            })
          : it('mint(maxMint) is not capped and consumes the full claim', async function () {
              // check: maxDeposit is capped, but maxMint is not
              await expect(this.mock.maxDeposit(this.alice)).to.eventually.equal(cap);
              await expect(this.mock.maxMint(this.alice)).to.eventually.equal(amount);

              // action: claim everything in a single mint(maxMint)
              await this.mock.connect(this.alice).mint(amount, this.alice, ethers.Typed.address(this.alice));

              // expect: alice received exactly her entitlement, and nothing is left to claim
              await expect(this.mock.balanceOf(this.alice)).to.eventually.equal(amount);
              await expect(this.mock.maxDeposit(this.alice)).to.eventually.equal(0n);
              await expect(this.mock.maxMint(this.alice)).to.eventually.equal(0n);
            });

        capDerivedLimits
          ? it('withdraw(maxWithdraw) respects the redeem cap', async function () {
              await claimDepositsAndRequestRedeem.call(this);

              // check: maxWithdraw is derived from the capped _asyncMaxRedeem, and withdrawing above it reverts
              await expect(this.mock.maxWithdraw(this.alice)).to.eventually.equal(cap);
              await expect(this.mock.connect(this.alice).withdraw(cap + 1n, this.alice, this.alice))
                .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxWithdraw')
                .withArgs(this.alice, cap + 1n, cap);

              // action: claim with withdraw(maxWithdraw) until nothing is left, each call staying within the cap
              await claimAll(
                () => this.mock.maxWithdraw(this.alice),
                max => this.mock.connect(this.alice).withdraw(max, this.alice, this.alice),
              );

              // expect: alice received exactly her entitlement, and bob's position is untouched
              await expect(this.token.balanceOf(this.alice)).to.eventually.equal(amount);
              await expect(this.mock.convertToAssets(this.mock.balanceOf(this.bob))).to.eventually.equal(amount);
            })
          : it('withdraw(maxWithdraw) is not capped and consumes the full claim', async function () {
              await claimDepositsAndRequestRedeem.call(this);

              // check: maxRedeem is capped, but maxWithdraw is not
              await expect(this.mock.maxRedeem(this.alice)).to.eventually.equal(cap);
              await expect(this.mock.maxWithdraw(this.alice)).to.eventually.equal(amount);

              // action: claim everything in a single withdraw(maxWithdraw)
              await this.mock.connect(this.alice).withdraw(amount, this.alice, this.alice);

              // expect: alice received exactly her entitlement, nothing is left to claim, and bob's position is untouched
              await expect(this.token.balanceOf(this.alice)).to.eventually.equal(amount);
              await expect(this.mock.maxRedeem(this.alice)).to.eventually.equal(0n);
              await expect(this.mock.maxWithdraw(this.alice)).to.eventually.equal(0n);
              await expect(this.mock.convertToAssets(this.mock.balanceOf(this.bob))).to.eventually.equal(amount);
            });

        it('redeem(maxRedeem) respects the redeem cap', async function () {
          await claimDepositsAndRequestRedeem.call(this);

          // check: maxRedeem is capped, and redeeming above it reverts
          await expect(this.mock.maxRedeem(this.alice)).to.eventually.equal(cap);
          await expect(this.mock.connect(this.alice).redeem(cap + 1n, this.alice, this.alice))
            .to.be.revertedWithCustomError(this.mock, 'ERC4626ExceededMaxRedeem')
            .withArgs(this.alice, cap + 1n, cap);

          // action: claim with redeem(maxRedeem) until nothing is left, each call staying within the cap
          await claimAll(
            () => this.mock.maxRedeem(this.alice),
            max => this.mock.connect(this.alice).redeem(max, this.alice, this.alice),
          );

          // expect: alice received exactly her entitlement, and bob's position is untouched
          await expect(this.token.balanceOf(this.alice)).to.eventually.equal(amount);
          await expect(this.mock.convertToAssets(this.mock.balanceOf(this.bob))).to.eventually.equal(amount);
        });
      });
    }

    // at a rate of 300 units per share (or per asset), the cap (400) and the full claim (500) round to the same amount
    describe('when the cap and the full claim round to the same amount', function () {
      beforeEach(async function () {
        this.mock = await ethers.deployContract('$ERC7540DelayCappedHooksMock', [name, symbol, this.token]);
      });

      it('mint(maxMint) consumes exactly the capped assets', async function () {
        // setup: 599 assets back 1 share, and alice has a matured deposit of 500 assets
        await this.token.$_mint(this.mock, 599n);
        await this.mock.$_mint(this.bob, 1n);
        await this.token.$_mint(this.alice, 500n);
        await this.token.connect(this.alice).approve(this.mock, ethers.MaxUint256);
        await this.mock.connect(this.alice).requestDeposit(500n, this.alice, this.alice);
        await time.increaseBy.timestamp(delay);

        // check: both the capped (400) and the full (500) claims are worth 1 share
        await expect(this.mock.maxDeposit(this.alice)).to.eventually.equal(cap);
        await expect(this.mock.maxMint(this.alice)).to.eventually.equal(1n);
        await expect(this.mock.convertToShares(500n)).to.eventually.equal(1n);

        // action: claim with mint(maxMint)
        await this.mock.connect(this.alice).mint(1n, this.alice, ethers.Typed.address(this.alice));

        // expect: alice received 1 share for exactly the capped 400 assets, and the remaining 100 are still claimable
        await expect(this.mock.balanceOf(this.alice)).to.eventually.equal(1n);
        await expect(this.mock.maxDeposit(this.alice)).to.eventually.equal(100n);
      });

      it('withdraw(maxWithdraw) consumes exactly the capped shares', async function () {
        // setup: 1 asset backs 599 shares, and alice has a matured redeem of 500 shares
        await this.token.$_mint(this.mock, 1n);
        await this.mock.$_mint(this.alice, 599n);
        await this.mock.connect(this.alice).requestRedeem(500n, this.alice, this.alice);
        await time.increaseBy.timestamp(delay);

        // check: both the capped (400) and the full (500) claims are worth 1 asset
        await expect(this.mock.maxRedeem(this.alice)).to.eventually.equal(cap);
        await expect(this.mock.maxWithdraw(this.alice)).to.eventually.equal(1n);
        await expect(this.mock.convertToAssets(500n)).to.eventually.equal(1n);

        // action: claim with withdraw(maxWithdraw)
        await this.mock.connect(this.alice).withdraw(1n, this.alice, this.alice);

        // expect: alice received 1 asset for exactly the capped 400 shares, and the remaining 100 are still claimable
        await expect(this.token.balanceOf(this.alice)).to.eventually.equal(1n);
        await expect(this.mock.maxRedeem(this.alice)).to.eventually.equal(100n);
      });
    });
  });
});
