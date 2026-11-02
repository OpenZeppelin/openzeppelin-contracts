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
  networkHelpers: { loadFixture },
} = await network.create();

const name = 'Vault Shares';
const symbol = 'vSHR';
const tokenName = 'Asset Token';
const tokenSymbol = 'AST';

describe('ERC7540Admin', function () {
  before(function () {
    this.ethers = ethers;
  });

  for (const withTmpHolder of [false, true]) {
    describe(withTmpHolder ? 'With a temporary share holder' : 'With direct share operations', function () {
      async function fixture() {
        const token = await ethers.deployContract('$ERC20', [tokenName, tokenSymbol]);
        const mock = await ethers.deployContract('$ERC7540AdminMock', [
          name,
          symbol,
          token,
          withTmpHolder ? '0x000000000000000000000000000000000000dead' : ethers.ZeroAddress,
        ]);
        return { token, mock };
      }

      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));

        this.getRequestId = () => 0n;
        this.fulfillDeposit = (requestId, assets, shares, controller) =>
          this.mock.$_fulfillDeposit(assets, shares, controller);
        this.fulfillRedeem = (requestId, assets, shares, controller) =>
          this.mock.$_fulfillRedeem(shares, assets, controller);
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

        it('reports async deposit and redeem', async function () {
          await expect(this.mock.$_isDepositAsync()).to.eventually.equal(true);
          await expect(this.mock.$_isRedeemAsync()).to.eventually.equal(true);
        });
      });

      shouldBehaveLikeERC7540Operator();
      shouldBehaveLikeERC7540Deposit({ supportCustomFulfill: true });
      shouldBehaveLikeERC7540Redeem({ supportCustomFulfill: true });
      shouldBehaveLikeERC7575();

      it('totalSupply matches ERC-20 balances while requests are in flight', async function () {
        const [, alice, bob] = await ethers.getSigners();
        const tmpHolder = withTmpHolder ? '0x000000000000000000000000000000000000dead' : ethers.ZeroAddress;
        const sumOfBalances = () =>
          Promise.all([alice, bob, tmpHolder].map(account => this.mock.balanceOf(account))).then(balances =>
            balances.reduce((a, b) => a + b, 0n),
          );
        const expectSupply = async (supply, outstanding) => {
          await expect(this.mock.totalSupply()).to.eventually.equal(supply);
          await expect(this.mock.totalSupply()).to.eventually.equal(await sumOfBalances());
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(outstanding);
        };

        // alice and bob each hold 100 shares
        for (const user of [alice, bob]) {
          await this.token.$_mint(user, 200n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
          await this.mock.connect(user).requestDeposit(100n, user, user);
          await this.mock.$_fulfillDeposit(100n, 100n, user);
          await this.mock.connect(user).getFunction('deposit(uint256,address,address)')(100n, user, user);
        }
        await expectSupply(200n, 200n);

        // bob's redeem request takes his shares out of circulation (burned or escrowed)
        await this.mock.connect(bob).requestRedeem(100n, bob, bob);
        await expectSupply(withTmpHolder ? 200n : 100n, 200n);

        // fulfilling the redeem settles it: the shares are no longer outstanding
        await this.mock.$_fulfillRedeem(100n, 100n, bob);
        await expectSupply(100n, 100n);

        // fulfilling a deposit settles it: the shares are outstanding, but only minted if pre-minted
        await this.mock.connect(alice).requestDeposit(100n, alice, alice);
        await this.mock.$_fulfillDeposit(100n, 100n, alice);
        await expectSupply(withTmpHolder ? 200n : 100n, 200n);
      });

      describe('multiple partial claims', function () {
        it('deposit flow - finish with a deposit', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).requestDeposit(100n, user, user);

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.fulfillDeposit(0n, 17n, 42n, user);

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(17n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(17n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(42n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).deposit(5n, user); // 5 assets => 12 shares

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(12n); // 17 - 5
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(12n); // 17 - 5
          await expect(this.mock.maxMint(user)).to.eventually.equal(30n); // 42 - 12
          await expect(this.mock.balanceOf(user)).to.eventually.equal(12n);

          await this.mock.connect(user).mint(8n, user); // 8 shares => 4 assets

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(8n); // 17 - 5 - 4
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(8n); // 17 - 5 - 4
          await expect(this.mock.maxMint(user)).to.eventually.equal(22n); // 42 - 12 - 8
          await expect(this.mock.balanceOf(user)).to.eventually.equal(20n);

          await this.mock.connect(user).deposit(this.mock.maxDeposit(user), user); // should mint all the rest

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(42n);
        });

        it('deposit flow - finish with a mint', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).requestDeposit(100n, user, user);

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.fulfillDeposit(0n, 17n, 42n, user);

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(17n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(17n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(42n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).mint(8n, user); // 8 shares => 4 assets

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(13n); // 17 - 4
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(13n); // 17 - 4
          await expect(this.mock.maxMint(user)).to.eventually.equal(34n); // 42 - 8
          await expect(this.mock.balanceOf(user)).to.eventually.equal(8n);

          await this.mock.connect(user).deposit(5n, user); // 5 assets => 13 shares

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(8n); // 17 - 4 - 5
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(8n); // 17 - 4 - 5
          await expect(this.mock.maxMint(user)).to.eventually.equal(21n); // 42 - 8 - 13
          await expect(this.mock.balanceOf(user)).to.eventually.equal(21n);

          await this.mock.connect(user).mint(this.mock.maxMint(user), user); // should mint all the rest

          await expect(this.mock.pendingDepositRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(42n);
        });

        it('redeem flow - finish with a redeem', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).requestRedeem(100n, user, user);

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.fulfillRedeem(0n, 42n, 17n, user);

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(17n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(17n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(42n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).redeem(5n, user, user); // 5 shares => 12 assets

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(12n); // 17 - 5
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(12n); // 17 - 5
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(30n); // 42 - 12
          await expect(this.token.balanceOf(user)).to.eventually.equal(12n);

          await this.mock.connect(user).withdraw(8n, user, user); // 8 assets => 4 shares

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(8n); // 17 - 5 - 4
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(8n); // 17 - 5 - 4
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(22n); // 42 - 12 - 8
          await expect(this.token.balanceOf(user)).to.eventually.equal(20n);

          await this.mock.connect(user).redeem(this.mock.maxRedeem(user), user, user); // should mint all the rest

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(42n);
        });

        it('redeem flow - finish with a withdraw', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).requestRedeem(100n, user, user);

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(100n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.fulfillRedeem(0n, 42n, 17n, user);

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(17n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(17n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(42n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).withdraw(8n, user, user); // 8 assets => 4 shares

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(13n); // 17 - 4
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(13n); // 17 - 4
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(34n); // 42 - 8
          await expect(this.token.balanceOf(user)).to.eventually.equal(8n);

          await this.mock.connect(user).redeem(5n, user, user); // 5 shares => 13 assets

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(8n); // 17 - 4 - 5
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(8n); // 17 - 4 - 5
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(21n); // 42 - 8 - 13
          await expect(this.token.balanceOf(user)).to.eventually.equal(21n);

          await this.mock.connect(user).withdraw(this.mock.maxWithdraw(user), user, user); // should mint all the rest

          await expect(this.mock.pendingRedeemRequest(0n, user)).to.eventually.equal(83n);
          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(42n);
        });
      });

      describe('rounding corner cases', function () {
        it('deposit flow - rounding shares to 0 and deposit', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(user, 1000n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).requestDeposit(100n, user, user);
          await this.fulfillDeposit(0n, 1n, 100n, user);

          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(1n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(1n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(100n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).mint(1n, user); // 1 share => 1 asset

          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(99n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(1n);

          await this.mock.connect(user).deposit(0n, user); // 0 assets => 99 shares

          await expect(this.mock.claimableDepositRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxDeposit(user)).to.eventually.equal(0n);
          await expect(this.mock.maxMint(user)).to.eventually.equal(0n);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(100n);
        });

        it('redeem flow - rounding shares to 0 and redeem', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);

          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).requestRedeem(100n, user, user);
          await this.fulfillRedeem(0n, 100n, 1n, user);

          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(1n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(1n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(100n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(0n);

          await this.mock.connect(user).withdraw(1n, user, user); // 1 assets => 1 shares

          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(99n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(1n);

          await this.mock.connect(user).redeem(0n, user, user); // 0 shares => 99 assets

          await expect(this.mock.claimableRedeemRequest(0n, user)).to.eventually.equal(0n);
          await expect(this.mock.maxRedeem(user)).to.eventually.equal(0n);
          await expect(this.mock.maxWithdraw(user)).to.eventually.equal(0n);
          await expect(this.token.balanceOf(user)).to.eventually.equal(100n);
        });
      });

      describe('solvency', function () {
        it('redeem fulfillment cannot use the assets of pending deposits', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);
          await this.token.$_mint(user, 500n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);

          await this.mock.connect(user).requestDeposit(500n, user, user);
          await this.mock.connect(user).requestRedeem(100n, user, user);

          // The vault holds 1500 assets, 500 of which belong to the pending deposit
          await expect(this.fulfillRedeem(0n, 1001n, 100n, user)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540InsufficientAssets',
          );

          await this.fulfillRedeem(0n, 1000n, 100n, user);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
        });

        it('successive fulfillments cannot promise more assets than the vault holds', async function () {
          const [, user] = await ethers.getSigners();
          await this.token.$_mint(this.mock, 1000n);
          await this.mock.$_mint(user, 1000n);
          await this.mock.connect(user).requestRedeem(100n, user, user);

          // The first fulfillment takes all the vault's assets: nothing is left for the second one
          await this.fulfillRedeem(0n, 1000n, 50n, user);
          await expect(this.fulfillRedeem(0n, 1n, 50n, user)).to.be.revertedWithCustomError(
            this.mock,
            'ERC7540InsufficientAssets',
          );

          // Funding the vault allows the fulfillment
          await this.token.$_mint(this.mock, 1n);
          await this.fulfillRedeem(0n, 1n, 50n, user);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
        });

        it('assets of claimable deposits can back redeems claimed before the deposit is claimed', async function () {
          const [, user, other] = await ethers.getSigners();
          await this.token.$_mint(user, 500n);
          await this.token.connect(user).approve(this.mock, ethers.MaxUint256);
          await this.mock.$_mint(other, 500n);

          await this.mock.connect(user).requestDeposit(500n, user, user);
          await this.fulfillDeposit(0n, 500n, 500n, user);

          // The fulfilled deposit is settled: its assets back the redeem
          await this.mock.connect(other).requestRedeem(500n, other, other);
          await this.fulfillRedeem(0n, 500n, 500n, other);
          await this.mock.connect(other).redeem(500n, other, other);

          // In mint-on-claim custody, the vault holds no assets while the claimable deposit is still pending
          await expect(this.token.balanceOf(this.mock)).to.eventually.equal(0n);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
          await expect(this.mock.$_totalOutstandingShares()).to.eventually.equal(500n);

          await this.mock.connect(user).deposit(500n, user);
          await expect(this.mock.balanceOf(user)).to.eventually.equal(500n);
          await expect(this.mock.totalAssets()).to.eventually.equal(0n);
        });
      });

      describe('reentrancy', function () {
        it('a pre-transfer hook in requestDeposit cannot fulfill the request being made', async function () {
          const [, user] = await ethers.getSigners();
          const token = await ethers.deployContract('$ERC20Reentrant');
          const mock = await ethers.deployContract('$ERC7540AdminMock', [
            name,
            symbol,
            token,
            withTmpHolder ? '0x000000000000000000000000000000000000dead' : ethers.ZeroAddress,
          ]);

          await token.$_mint(user, 100n);
          await token.connect(user).approve(mock, ethers.MaxUint256);

          // the hook runs before the assets are transferred: the request is not recorded yet
          await token.scheduleReenter(
            0x01, // Before
            mock,
            mock.interface.encodeFunctionData('$_fulfillDeposit', [100n, 100n, user.address]),
          );
          await expect(mock.connect(user).requestDeposit(100n, user, user))
            .to.be.revertedWithCustomError(mock, 'ERC7540DepositInsufficientPendingAssets')
            .withArgs(100n, 0n);
        });
      });
    });
  }

  describe('native value', function () {
    async function nativeValueFixture() {
      const [holder] = await ethers.getSigners();
      const token = await ethers.deployContract('$ERC20', [tokenName, tokenSymbol]);
      const mock = await ethers.deployContract('$ERC7540AdminMock', [name, symbol, token, ethers.ZeroAddress]);
      return { holder, mock };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(nativeValueFixture));
    });

    it('deposit reverts when native value is sent', async function () {
      await expect(this.mock.connect(this.holder)['deposit(uint256,address)'](0n, this.holder, { value: 1n }))
        .to.be.revertedWithCustomError(this.mock, 'ERC4626UnexpectedNativeValue')
        .withArgs(1n);
    });

    it('mint reverts when native value is sent', async function () {
      await expect(this.mock.connect(this.holder)['mint(uint256,address)'](0n, this.holder, { value: 1n }))
        .to.be.revertedWithCustomError(this.mock, 'ERC4626UnexpectedNativeValue')
        .withArgs(1n);
    });
  });
});
