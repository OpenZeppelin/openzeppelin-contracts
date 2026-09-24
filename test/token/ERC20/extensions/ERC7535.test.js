import { network } from 'hardhat';
import { expect } from 'chai';
import { PANIC_CODES } from '@nomicfoundation/hardhat-ethers-chai-matchers/panic';

const {
  ethers,
  networkHelpers: { loadFixture, setBalance },
} = await network.create();

const name = 'My Native Vault';
const symbol = 'MNV';
const decimals = 18n;

// ERC-7528 native-asset placeholder (EIP-55 checksummed).
const NATIVE_ASSET = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

async function fixture() {
  const [holder, recipient, spender, other, ...accounts] = await ethers.getSigners();
  return { holder, recipient, spender, other, accounts };
}

describe('ERC7535', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('asset is the native-asset sentinel', async function () {
    const vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 0n]);
    await expect(vault.asset()).to.eventually.equal(NATIVE_ASSET);
  });

  it('decimals are 18 + offset', async function () {
    for (const offset of [0n, 6n, 18n]) {
      const vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, offset]);
      await expect(vault.decimals()).to.eventually.equal(decimals + offset);
    }
  });

  describe('native value (msg.value) handling', function () {
    beforeEach(async function () {
      this.vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 0n]);
      await setBalance(this.holder.address, ethers.parseEther('1000'));
    });

    it('deposit mints previewDeposit(msg.value) shares, ignoring the assets argument', async function () {
      const value = ethers.parseEther('1');
      const expectedShares = await this.vault.previewDeposit(value);

      // Per ERC-7535 the `assets` argument is advisory; shares are priced off `msg.value`. Passing 0 — which under
      // an assets-based implementation would mint 0 shares and donate the ether — still mints for the full value.
      const tx = this.vault.connect(this.holder).deposit(0n, this.recipient, { value });

      await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-value, value]);
      await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, expectedShares);
      await expect(this.vault.totalAssets()).to.eventually.equal(value);
    });

    it('deposit converts the entire msg.value to shares (no excess donation)', async function () {
      const value = ethers.parseEther('1.5');
      const expectedShares = await this.vault.previewDeposit(value);

      // Even with a smaller `assets` argument, the full msg.value is priced into shares (not retained as a donation).
      await expect(
        this.vault.connect(this.holder).deposit(ethers.parseEther('1'), this.recipient, { value }),
      ).to.changeTokenBalance(ethers, this.vault, this.recipient, expectedShares);
    });

    it('mint reverts when msg.value < cost', async function () {
      const shares = ethers.parseEther('1');
      const cost = await this.vault.previewMint(shares);
      await expect(this.vault.connect(this.holder).mint(shares, this.recipient, { value: cost - 1n }))
        .to.be.revertedWithCustomError(this.vault, 'ERC7535InsufficientNativeValue')
        .withArgs(cost - 1n, cost);
    });

    it('mint succeeds when msg.value == cost', async function () {
      const shares = ethers.parseEther('1');
      const cost = await this.vault.previewMint(shares);
      await expect(this.vault.connect(this.holder).mint(shares, this.recipient, { value: cost })).to.not.revert(ethers);
    });

    it('mint keeps the excess as a donation when msg.value > cost', async function () {
      const shares = ethers.parseEther('1');
      const cost = await this.vault.previewMint(shares);
      const extra = ethers.parseEther('0.5');

      const tx = this.vault.connect(this.holder).mint(shares, this.recipient, { value: cost + extra });

      await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-(cost + extra), cost + extra]);
      await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, shares);
      await expect(this.vault.totalAssets()).to.eventually.equal(cost + extra);
    });
  });

  describe('decimals offset bounds', function () {
    // decimals() = 18 + _decimalsOffset() overflows the uint8 return type above 237.
    for (const offset of [238n, 243n, 250n, 255n]) {
      it(`decimals() reverts at offset ${offset}`, async function () {
        const vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, offset]);
        await expect(vault.decimals()).to.be.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW);
      });
    }

    // The conversion math computes 10 ** offset, which overflows uint256 from offset 78 onwards — a tighter
    // ceiling than the uint8 bound on decimals(). Pin both sides of the boundary.
    it('conversions work at offset 77 (largest supported)', async function () {
      const vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 77n]);
      await setBalance(this.holder.address, ethers.parseEther('10'));

      await expect(vault.decimals()).to.eventually.equal(18n + 77n);
      await expect(vault.previewDeposit(1n)).to.eventually.equal(10n ** 77n);
      await expect(vault.connect(this.holder).deposit(1n, this.recipient, { value: 1n })).to.not.revert(ethers);
      await expect(vault.balanceOf(this.recipient)).to.eventually.equal(10n ** 77n);
    });

    it('conversions revert with an arithmetic panic at offset 78', async function () {
      const vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 78n]);
      await setBalance(this.holder.address, ethers.parseEther('10'));

      // The vault deploys but every conversion-dependent entry point is bricked.
      await expect(vault.previewDeposit(1n)).to.be.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW);
      await expect(vault.previewMint(1n)).to.be.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW);
      await expect(vault.connect(this.holder).deposit(1n, this.recipient, { value: 1n })).to.be.revertedWithPanic(
        PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW,
      );
    });
  });

  describe('outbound send failure', function () {
    beforeEach(async function () {
      this.vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 0n]);
      await setBalance(this.holder.address, ethers.parseEther('10'));
      await this.vault.connect(this.holder).deposit(ethers.parseEther('1'), this.holder, {
        value: ethers.parseEther('1'),
      });
      // A contract whose `receive()` always reverts — exercises the `Address.sendValue` failure path.
      this.rejector = await ethers.deployContract('$EtherReceiverMock');
      await this.rejector.setAcceptEther(false);
    });

    it('withdraw to a receiver whose receive() reverts bubbles the failure', async function () {
      await expect(
        this.vault.connect(this.holder).withdraw(ethers.parseEther('1'), this.rejector, this.holder),
      ).to.revert(ethers);
    });

    it('redeem to a receiver whose receive() reverts bubbles the failure', async function () {
      const shares = await this.vault.balanceOf(this.holder);
      await expect(this.vault.connect(this.holder).redeem(shares, this.rejector, this.holder)).to.revert(ethers);
    });
  });

  describe('receiver == address(0) (documenting test)', function () {
    // ERC4626 / ERC7535 don't require receiver != address(0) on withdraw/redeem; pin the current behavior
    // (ETH sent to the zero address, which has no code and accepts the value silently) so a future change
    // is forced to be deliberate.
    beforeEach(async function () {
      this.vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 0n]);
      await setBalance(this.holder.address, ethers.parseEther('10'));
      await this.vault.connect(this.holder).deposit(ethers.parseEther('1'), this.holder, {
        value: ethers.parseEther('1'),
      });
    });

    it('withdraw to address(0) succeeds and sends value to the zero address', async function () {
      const value = ethers.parseEther('1');
      const shares = await this.vault.previewWithdraw(value);
      const tx = this.vault.connect(this.holder).withdraw(value, ethers.ZeroAddress, this.holder);
      await expect(tx).to.changeEtherBalances(ethers, [this.vault, ethers.ZeroAddress], [-value, value]);
      await expect(tx)
        .to.emit(this.vault, 'Withdraw')
        .withArgs(this.holder, ethers.ZeroAddress, this.holder, value, shares);
    });
  });

  for (const offset of [0n, 6n, 18n]) {
    const parseAsset = asset => asset * 10n ** decimals;
    const parseShare = share => share * 10n ** (decimals + offset);

    const virtualAssets = 1n;
    const virtualShares = 10n ** offset;

    describe(`offset: ${offset}`, function () {
      beforeEach(async function () {
        const vault = await ethers.deployContract('$ERC7535OffsetMock', [name + ' Vault', symbol + 'V', offset]);

        // Fund the holder with plenty of native asset.
        await setBalance(this.holder.address, ethers.MaxUint256 / 2n);
        // Approve spender over holder's shares for third-party withdraw/redeem paths.
        await vault.$_approve(this.holder, this.spender, ethers.MaxUint256);

        Object.assign(this, { vault });
      });

      it('metadata', async function () {
        await expect(this.vault.name()).to.eventually.equal(name + ' Vault');
        await expect(this.vault.symbol()).to.eventually.equal(symbol + 'V');
        await expect(this.vault.decimals()).to.eventually.equal(decimals + offset);
        await expect(this.vault.asset()).to.eventually.equal(NATIVE_ASSET);
      });

      describe('empty vault: no assets & no shares', function () {
        it('status', async function () {
          await expect(this.vault.totalAssets()).to.eventually.equal(0n);
        });

        it('deposit', async function () {
          await expect(this.vault.maxDeposit(this.holder)).to.eventually.equal(ethers.MaxUint256);
          await expect(this.vault.previewDeposit(parseAsset(1n))).to.eventually.equal(parseShare(1n));

          const tx = this.vault.connect(this.holder).deposit(parseAsset(1n), this.recipient, { value: parseAsset(1n) });

          await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-parseAsset(1n), parseAsset(1n)]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, parseShare(1n));
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, parseShare(1n))
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, parseAsset(1n), parseShare(1n));
        });

        it('mint', async function () {
          await expect(this.vault.maxMint(this.holder)).to.eventually.equal(ethers.MaxUint256);
          await expect(this.vault.previewMint(parseShare(1n))).to.eventually.equal(parseAsset(1n));

          const tx = this.vault.connect(this.holder).mint(parseShare(1n), this.recipient, { value: parseAsset(1n) });

          await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-parseAsset(1n), parseAsset(1n)]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, parseShare(1n));
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, parseShare(1n))
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, parseAsset(1n), parseShare(1n));
        });

        it('withdraw', async function () {
          await expect(this.vault.maxWithdraw(this.holder)).to.eventually.equal(0n);
          await expect(this.vault.previewWithdraw(0n)).to.eventually.equal(0n);

          const tx = this.vault.connect(this.holder).withdraw(0n, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances(ethers, [this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });

        it('redeem', async function () {
          await expect(this.vault.maxRedeem(this.holder)).to.eventually.equal(0n);
          await expect(this.vault.previewRedeem(0n)).to.eventually.equal(0n);

          const tx = this.vault.connect(this.holder).redeem(0n, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances(ethers, [this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });
      });

      describe('inflation attack: offset price by direct donation of native asset', function () {
        beforeEach(async function () {
          // Force-feed 1 unit of native asset into the vault (SELFDESTRUCT / coinbase analogue): no shares minted.
          await setBalance(this.vault.target, parseAsset(1n));
        });

        it('status', async function () {
          await expect(this.vault.totalSupply()).to.eventually.equal(0n);
          await expect(this.vault.totalAssets()).to.eventually.equal(parseAsset(1n));
        });

        it('deposit', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const depositAssets = parseAsset(1n);
          const expectedShares = (depositAssets * effectiveShares) / effectiveAssets;

          await expect(this.vault.maxDeposit(this.holder)).to.eventually.equal(ethers.MaxUint256);
          // previewDeposit is queried BEFORE sending value: it sees the donated balance, not the in-flight value.
          await expect(this.vault.previewDeposit(depositAssets)).to.eventually.equal(expectedShares);

          const tx = this.vault.connect(this.holder).deposit(depositAssets, this.recipient, { value: depositAssets });

          await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-depositAssets, depositAssets]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, expectedShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, expectedShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAssets, expectedShares);
        });

        it('mint', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const mintShares = parseShare(1n);
          const expectedAssets = (mintShares * effectiveAssets) / effectiveShares;

          await expect(this.vault.maxMint(this.holder)).to.eventually.equal(ethers.MaxUint256);
          await expect(this.vault.previewMint(mintShares)).to.eventually.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).mint(mintShares, this.recipient, { value: expectedAssets });

          await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-expectedAssets, expectedAssets]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, mintShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, mintShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, expectedAssets, mintShares);
        });
      });

      describe('full vault: assets & shares', function () {
        beforeEach(async function () {
          // 1 unit of native asset balance and 100 shares.
          await setBalance(this.vault.target, parseAsset(1n));
          await this.vault.$_mint(this.holder, parseShare(100n));
        });

        it('status', async function () {
          await expect(this.vault.totalSupply()).to.eventually.equal(parseShare(100n));
          await expect(this.vault.totalAssets()).to.eventually.equal(parseAsset(1n));
        });

        it('deposit', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const depositAssets = parseAsset(1n);
          const expectedShares = (depositAssets * effectiveShares) / effectiveAssets;

          await expect(this.vault.maxDeposit(this.holder)).to.eventually.equal(ethers.MaxUint256);
          await expect(this.vault.previewDeposit(depositAssets)).to.eventually.equal(expectedShares);

          const tx = this.vault.connect(this.holder).deposit(depositAssets, this.recipient, { value: depositAssets });

          await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-depositAssets, depositAssets]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, expectedShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, expectedShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, depositAssets, expectedShares);
        });

        it('mint', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const mintShares = parseShare(1n);
          const expectedAssets = (mintShares * effectiveAssets) / effectiveShares + 1n; // round up

          await expect(this.vault.maxMint(this.holder)).to.eventually.equal(ethers.MaxUint256);
          await expect(this.vault.previewMint(mintShares)).to.eventually.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).mint(mintShares, this.recipient, { value: expectedAssets });

          await expect(tx).to.changeEtherBalances(ethers, [this.holder, this.vault], [-expectedAssets, expectedAssets]);
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.recipient, mintShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, mintShares)
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, expectedAssets, mintShares);
        });

        it('withdraw', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const withdrawAssets = parseAsset(1n);
          const expectedShares = (withdrawAssets * effectiveShares) / effectiveAssets + 1n; // round up

          await expect(this.vault.maxWithdraw(this.holder)).to.eventually.equal(withdrawAssets);
          await expect(this.vault.previewWithdraw(withdrawAssets)).to.eventually.equal(expectedShares);

          const tx = this.vault.connect(this.holder).withdraw(withdrawAssets, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances(
            ethers,
            [this.vault, this.recipient],
            [-withdrawAssets, withdrawAssets],
          );
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.holder, -expectedShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, expectedShares)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, withdrawAssets, expectedShares);
        });

        it('withdraw with approval', async function () {
          const shares = await this.vault.previewWithdraw(parseAsset(1n));

          await expect(this.vault.connect(this.other).withdraw(parseAsset(1n), this.recipient, this.holder))
            .to.be.revertedWithCustomError(this.vault, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, shares);

          await expect(
            this.vault.connect(this.spender).withdraw(parseAsset(1n), this.recipient, this.holder),
          ).to.not.revert(ethers);
        });

        it('redeem', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const redeemShares = parseShare(100n);
          const expectedAssets = (redeemShares * effectiveAssets) / effectiveShares;

          await expect(this.vault.maxRedeem(this.holder)).to.eventually.equal(redeemShares);
          await expect(this.vault.previewRedeem(redeemShares)).to.eventually.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).redeem(redeemShares, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances(
            ethers,
            [this.vault, this.recipient],
            [-expectedAssets, expectedAssets],
          );
          await expect(tx).to.changeTokenBalance(ethers, this.vault, this.holder, -redeemShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, redeemShares)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, expectedAssets, redeemShares);
        });

        it('redeem with approval', async function () {
          await expect(this.vault.connect(this.other).redeem(parseShare(100n), this.recipient, this.holder))
            .to.be.revertedWithCustomError(this.vault, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, parseShare(100n));

          await expect(
            this.vault.connect(this.spender).redeem(parseShare(100n), this.recipient, this.holder),
          ).to.not.revert(ethers);
        });
      });
    });
  }

  // Yield scenario adapted from the ERC-4626 suite to the native asset.
  it('full vault: yield accrual via force-fed native asset', async function () {
    const vault = await ethers.deployContract('$ERC7535', [name, symbol]);
    const [alice, bruce] = this.accounts;

    await setBalance(alice.address, ethers.parseEther('1000'));
    await setBalance(bruce.address, ethers.parseEther('1000'));

    // 1. Alice deposits 2000 wei
    await vault.connect(alice).deposit(2000n, alice, { value: 2000n });
    await expect(vault.balanceOf(alice)).to.eventually.equal(2000n);
    await expect(vault.totalSupply()).to.eventually.equal(2000n);
    await expect(vault.totalAssets()).to.eventually.equal(2000n);

    // 2. Bruce deposits 4000 wei
    await vault.connect(bruce).deposit(4000n, bruce, { value: 4000n });
    await expect(vault.balanceOf(bruce)).to.eventually.equal(4000n);
    await expect(vault.totalSupply()).to.eventually.equal(6000n);
    await expect(vault.totalAssets()).to.eventually.equal(6000n);

    // 3. Vault mutates by +3000 wei (simulated yield force-fed into the balance)
    await setBalance(vault.target, 9000n);

    // Virtual assets/shares capture a sliver of the yield (mirrors ERC-4626 behavior)
    await expect(vault.convertToAssets(vault.balanceOf(alice))).to.eventually.equal(2999n);
    await expect(vault.convertToAssets(vault.balanceOf(bruce))).to.eventually.equal(5999n);
    await expect(vault.totalSupply()).to.eventually.equal(6000n);
    await expect(vault.totalAssets()).to.eventually.equal(9000n);

    // 4. Alice redeems all her shares; never extracts more than her fair share.
    await expect(vault.connect(alice).redeem(2000n, alice, alice))
      .to.emit(vault, 'Withdraw')
      .withArgs(alice, alice, alice, 2999n, 2000n);
    await expect(vault.balanceOf(alice)).to.eventually.equal(0n);
  });
});
