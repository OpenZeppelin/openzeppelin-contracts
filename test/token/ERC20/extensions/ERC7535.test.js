const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, setBalance } = require('@nomicfoundation/hardhat-network-helpers');
const { PANIC_CODES } = require('@nomicfoundation/hardhat-chai-matchers/panic');

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
    expect(await vault.asset()).to.equal(NATIVE_ASSET);
  });

  it('decimals are 18 + offset', async function () {
    for (const offset of [0n, 6n, 18n]) {
      const vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, offset]);
      expect(await vault.decimals()).to.equal(decimals + offset);
    }
  });

  describe('native value (msg.value) handling', function () {
    beforeEach(async function () {
      this.vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 0n]);
      await setBalance(this.holder.address, ethers.parseEther('1000'));
    });

    it('deposit reverts when msg.value < assets', async function () {
      const assets = ethers.parseEther('1');
      await expect(this.vault.connect(this.holder).deposit(assets, this.recipient, { value: assets - 1n }))
        .to.be.revertedWithCustomError(this.vault, 'ERC7535InsufficientNativeValue')
        .withArgs(assets - 1n, assets);
    });

    it('deposit succeeds when msg.value == assets', async function () {
      const assets = ethers.parseEther('1');
      await expect(this.vault.connect(this.holder).deposit(assets, this.recipient, { value: assets })).to.not.be
        .reverted;
    });

    it('deposit keeps the excess as a donation when msg.value > assets', async function () {
      const assets = ethers.parseEther('1');
      const extra = ethers.parseEther('0.5');
      // Shares are priced on `assets` (the in-flight value is excluded from the rate via _pretotalAssets).
      const expectedShares = await this.vault.previewDeposit(assets);

      const tx = this.vault.connect(this.holder).deposit(assets, this.recipient, { value: assets + extra });

      await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-(assets + extra), assets + extra]);
      await expect(tx).to.changeTokenBalance(this.vault, this.recipient, expectedShares);
      // The full msg.value entered the vault; the excess is an unminted donation.
      expect(await this.vault.totalAssets()).to.equal(assets + extra);
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
      await expect(this.vault.connect(this.holder).mint(shares, this.recipient, { value: cost })).to.not.be.reverted;
    });

    it('mint keeps the excess as a donation when msg.value > cost', async function () {
      const shares = ethers.parseEther('1');
      const cost = await this.vault.previewMint(shares);
      const extra = ethers.parseEther('0.5');

      const tx = this.vault.connect(this.holder).mint(shares, this.recipient, { value: cost + extra });

      await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-(cost + extra), cost + extra]);
      await expect(tx).to.changeTokenBalance(this.vault, this.recipient, shares);
      expect(await this.vault.totalAssets()).to.equal(cost + extra);
    });
  });

  describe('rejects plain ETH transfers', function () {
    beforeEach(async function () {
      this.vault = await ethers.deployContract('$ERC7535OffsetMock', [name, symbol, 0n]);
      await setBalance(this.holder.address, ethers.parseEther('1000'));
    });

    it('receive() reverts with ERC7535UnsolicitedDeposit on a plain transfer', async function () {
      await expect(this.holder.sendTransaction({ to: this.vault.target, value: 1n })).to.be.revertedWithCustomError(
        this.vault,
        'ERC7535UnsolicitedDeposit',
      );
    });

    it('receive() reverts on a non-trivial plain transfer', async function () {
      await expect(
        this.holder.sendTransaction({ to: this.vault.target, value: ethers.parseEther('1') }),
      ).to.be.revertedWithCustomError(this.vault, 'ERC7535UnsolicitedDeposit');
    });

    it('totalAssets does not increase after a rejected plain transfer', async function () {
      const before = await this.vault.totalAssets();
      await expect(this.holder.sendTransaction({ to: this.vault.target, value: 1n })).to.be.reverted;
      expect(await this.vault.totalAssets()).to.equal(before);
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

      expect(await vault.decimals()).to.equal(18n + 77n);
      expect(await vault.previewDeposit(1n)).to.equal(10n ** 77n);
      await expect(vault.connect(this.holder).deposit(1n, this.recipient, { value: 1n })).to.not.be.reverted;
      expect(await vault.balanceOf(this.recipient)).to.equal(10n ** 77n);
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
      await expect(this.vault.connect(this.holder).withdraw(ethers.parseEther('1'), this.rejector, this.holder)).to.be
        .reverted;
    });

    it('redeem to a receiver whose receive() reverts bubbles the failure', async function () {
      const shares = await this.vault.balanceOf(this.holder);
      await expect(this.vault.connect(this.holder).redeem(shares, this.rejector, this.holder)).to.be.reverted;
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
      const tx = this.vault.connect(this.holder).withdraw(value, ethers.ZeroAddress, this.holder);
      await expect(tx).to.changeEtherBalances([this.vault, ethers.ZeroAddress], [-value, value]);
      await expect(tx).to.emit(this.vault, 'Withdraw');
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
        expect(await this.vault.name()).to.equal(name + ' Vault');
        expect(await this.vault.symbol()).to.equal(symbol + 'V');
        expect(await this.vault.decimals()).to.equal(decimals + offset);
        expect(await this.vault.asset()).to.equal(NATIVE_ASSET);
      });

      describe('empty vault: no assets & no shares', function () {
        it('status', async function () {
          expect(await this.vault.totalAssets()).to.equal(0n);
        });

        it('deposit', async function () {
          expect(await this.vault.maxDeposit(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewDeposit(parseAsset(1n))).to.equal(parseShare(1n));

          const tx = this.vault.connect(this.holder).deposit(parseAsset(1n), this.recipient, { value: parseAsset(1n) });

          await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-parseAsset(1n), parseAsset(1n)]);
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, parseShare(1n));
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, parseShare(1n))
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, parseAsset(1n), parseShare(1n));
        });

        it('mint', async function () {
          expect(await this.vault.maxMint(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewMint(parseShare(1n))).to.equal(parseAsset(1n));

          const tx = this.vault.connect(this.holder).mint(parseShare(1n), this.recipient, { value: parseAsset(1n) });

          await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-parseAsset(1n), parseAsset(1n)]);
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, parseShare(1n));
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(ethers.ZeroAddress, this.recipient, parseShare(1n))
            .to.emit(this.vault, 'Deposit')
            .withArgs(this.holder, this.recipient, parseAsset(1n), parseShare(1n));
        });

        it('withdraw', async function () {
          expect(await this.vault.maxWithdraw(this.holder)).to.equal(0n);
          expect(await this.vault.previewWithdraw(0n)).to.equal(0n);

          const tx = this.vault.connect(this.holder).withdraw(0n, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances([this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, 0n);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, 0n)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, 0n, 0n);
        });

        it('redeem', async function () {
          expect(await this.vault.maxRedeem(this.holder)).to.equal(0n);
          expect(await this.vault.previewRedeem(0n)).to.equal(0n);

          const tx = this.vault.connect(this.holder).redeem(0n, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances([this.vault, this.recipient], [0n, 0n]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, 0n);
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
          expect(await this.vault.totalSupply()).to.equal(0n);
          expect(await this.vault.totalAssets()).to.equal(parseAsset(1n));
        });

        it('deposit', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const depositAssets = parseAsset(1n);
          const expectedShares = (depositAssets * effectiveShares) / effectiveAssets;

          expect(await this.vault.maxDeposit(this.holder)).to.equal(ethers.MaxUint256);
          // previewDeposit is queried BEFORE sending value: it sees the donated balance, not the in-flight value.
          expect(await this.vault.previewDeposit(depositAssets)).to.equal(expectedShares);

          const tx = this.vault.connect(this.holder).deposit(depositAssets, this.recipient, { value: depositAssets });

          await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-depositAssets, depositAssets]);
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, expectedShares);
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

          expect(await this.vault.maxMint(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewMint(mintShares)).to.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).mint(mintShares, this.recipient, { value: expectedAssets });

          await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-expectedAssets, expectedAssets]);
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, mintShares);
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
          expect(await this.vault.totalSupply()).to.equal(parseShare(100n));
          expect(await this.vault.totalAssets()).to.equal(parseAsset(1n));
        });

        it('deposit', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const depositAssets = parseAsset(1n);
          const expectedShares = (depositAssets * effectiveShares) / effectiveAssets;

          expect(await this.vault.maxDeposit(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewDeposit(depositAssets)).to.equal(expectedShares);

          const tx = this.vault.connect(this.holder).deposit(depositAssets, this.recipient, { value: depositAssets });

          await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-depositAssets, depositAssets]);
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, expectedShares);
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

          expect(await this.vault.maxMint(this.holder)).to.equal(ethers.MaxUint256);
          expect(await this.vault.previewMint(mintShares)).to.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).mint(mintShares, this.recipient, { value: expectedAssets });

          await expect(tx).to.changeEtherBalances([this.holder, this.vault], [-expectedAssets, expectedAssets]);
          await expect(tx).to.changeTokenBalance(this.vault, this.recipient, mintShares);
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

          expect(await this.vault.maxWithdraw(this.holder)).to.equal(withdrawAssets);
          expect(await this.vault.previewWithdraw(withdrawAssets)).to.equal(expectedShares);

          const tx = this.vault.connect(this.holder).withdraw(withdrawAssets, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances([this.vault, this.recipient], [-withdrawAssets, withdrawAssets]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, -expectedShares);
          await expect(tx)
            .to.emit(this.vault, 'Transfer')
            .withArgs(this.holder, ethers.ZeroAddress, expectedShares)
            .to.emit(this.vault, 'Withdraw')
            .withArgs(this.holder, this.recipient, this.holder, withdrawAssets, expectedShares);
        });

        it('withdraw with approval', async function () {
          const assets = await this.vault.previewWithdraw(parseAsset(1n));

          await expect(this.vault.connect(this.other).withdraw(parseAsset(1n), this.recipient, this.holder))
            .to.be.revertedWithCustomError(this.vault, 'ERC20InsufficientAllowance')
            .withArgs(this.other, 0n, assets);

          await expect(this.vault.connect(this.spender).withdraw(parseAsset(1n), this.recipient, this.holder)).to.not.be
            .reverted;
        });

        it('redeem', async function () {
          const effectiveAssets = (await this.vault.totalAssets()) + virtualAssets;
          const effectiveShares = (await this.vault.totalSupply()) + virtualShares;

          const redeemShares = parseShare(100n);
          const expectedAssets = (redeemShares * effectiveAssets) / effectiveShares;

          expect(await this.vault.maxRedeem(this.holder)).to.equal(redeemShares);
          expect(await this.vault.previewRedeem(redeemShares)).to.equal(expectedAssets);

          const tx = this.vault.connect(this.holder).redeem(redeemShares, this.recipient, this.holder);

          await expect(tx).to.changeEtherBalances([this.vault, this.recipient], [-expectedAssets, expectedAssets]);
          await expect(tx).to.changeTokenBalance(this.vault, this.holder, -redeemShares);
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

          await expect(this.vault.connect(this.spender).redeem(parseShare(100n), this.recipient, this.holder)).to.not.be
            .reverted;
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
    expect(await vault.balanceOf(alice)).to.equal(2000n);
    expect(await vault.totalSupply()).to.equal(2000n);
    expect(await vault.totalAssets()).to.equal(2000n);

    // 2. Bruce deposits 4000 wei
    await vault.connect(bruce).deposit(4000n, bruce, { value: 4000n });
    expect(await vault.balanceOf(bruce)).to.equal(4000n);
    expect(await vault.totalSupply()).to.equal(6000n);
    expect(await vault.totalAssets()).to.equal(6000n);

    // 3. Vault mutates by +3000 wei (simulated yield force-fed into the balance)
    await setBalance(vault.target, 9000n);

    // Virtual assets/shares capture a sliver of the yield (mirrors ERC-4626 behavior)
    expect(await vault.convertToAssets(await vault.balanceOf(alice))).to.equal(2999n);
    expect(await vault.convertToAssets(await vault.balanceOf(bruce))).to.equal(5999n);
    expect(await vault.totalSupply()).to.equal(6000n);
    expect(await vault.totalAssets()).to.equal(9000n);

    // 4. Alice redeems all her shares; never extracts more than her fair share.
    await expect(vault.connect(alice).redeem(2000n, alice, alice))
      .to.emit(vault, 'Withdraw')
      .withArgs(alice, alice, alice, 2999n, 2000n);
    expect(await vault.balanceOf(alice)).to.equal(0n);
  });
});
