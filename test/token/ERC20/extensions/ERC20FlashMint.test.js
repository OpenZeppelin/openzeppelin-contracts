const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const name = 'My Token';
const symbol = 'MTKN';
const initialSupply = 100n;
const loanValue = 10_000_000_000_000n;

async function fixture() {
  const [holder, other] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC20FlashMintMock', [name, symbol]);
  await token.$_mint(holder, initialSupply);

  return { holder, other, token };
}

describe('ERC20FlashMint', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('maxFlashLoan', function () {
    it('token match', async function () {
      expect(await this.token.maxFlashLoan(this.token)).to.equal(ethers.MaxUint256 - initialSupply);
    });

    it('token mismatch', async function () {
      expect(await this.token.maxFlashLoan(ethers.ZeroAddress)).to.equal(0n);
    });
  });

  describe('flashFee', function () {
    it('token match', async function () {
      expect(await this.token.flashFee(this.token, loanValue)).to.equal(0n);
    });

    it('token mismatch', async function () {
      await expect(this.token.flashFee(ethers.ZeroAddress, loanValue))
        .to.be.revertedWithCustomError(this.token, 'ERC3156UnsupportedToken')
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe('flashFeeReceiver', function () {
    it('default receiver', async function () {
      expect(await this.token.$_flashFeeReceiver()).to.equal(ethers.ZeroAddress);
    });
  });

  describe('flashLoan', function () {
    it('success', async function () {
      const receiver = await ethers.deployContract('ERC3156FlashBorrowerMock', [true, true]);

      const tx = await this.token.flashLoan(receiver, this.token, loanValue, '0x');
      await expect(tx)
        .to.emit(this.token, 'Transfer')
        .withArgs(ethers.ZeroAddress, receiver, loanValue)
        .to.emit(this.token, 'Transfer')
        .withArgs(receiver, ethers.ZeroAddress, loanValue)
        .to.emit(receiver, 'BalanceOf')
        .withArgs(this.token, receiver, loanValue)
        .to.emit(receiver, 'TotalSupply')
        .withArgs(this.token, initialSupply + loanValue);
      await expect(tx).to.changeTokenBalance(this.token, receiver, 0);

      expect(await this.token.totalSupply()).to.equal(initialSupply);
      expect(await this.token.allowance(receiver, this.token)).to.equal(0n);
    });

    it('missing return value', async function () {
      const receiver = await ethers.deployContract('ERC3156FlashBorrowerMock', [false, true]);
      await expect(this.token.flashLoan(receiver, this.token, loanValue, '0x'))
        .to.be.revertedWithCustomError(this.token, 'ERC3156InvalidReceiver')
        .withArgs(receiver);
    });

    it('missing approval', async function () {
      const receiver = await ethers.deployContract('ERC3156FlashBorrowerMock', [true, false]);
      await expect(this.token.flashLoan(receiver, this.token, loanValue, '0x'))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientAllowance')
        .withArgs(this.token, 0, loanValue);
    });

    it('unavailable funds', async function () {
      const receiver = await ethers.deployContract('ERC3156FlashBorrowerMock', [true, true]);
      const data = this.token.interface.encodeFunctionData('transfer', [this.other.address, 10]);
      await expect(this.token.flashLoan(receiver, this.token, loanValue, data))
        .to.be.revertedWithCustomError(this.token, 'ERC20InsufficientBalance')
        .withArgs(receiver, loanValue - 10n, loanValue);
    });

    it('more than maxFlashLoan', async function () {
      const receiver = await ethers.deployContract('ERC3156FlashBorrowerMock', [true, true]);
      const data = this.token.interface.encodeFunctionData('transfer', [this.other.address, 10]);
      await expect(this.token.flashLoan(receiver, this.token, ethers.MaxUint256, data))
        .to.be.revertedWithCustomError(this.token, 'ERC3156ExceededMaxLoan')
        .withArgs(ethers.MaxUint256 - initialSupply);
    });

    describe('custom flash fee & custom fee receiver', function () {
      const receiverInitialBalance = 200_000n;
      const flashFee = 5_000n;

      beforeEach('init receiver balance & set flash fee', async function () {
        this.receiver = await ethers.deployContract('ERC3156FlashBorrowerMock', [true, true]);

        const tx = await this.token.$_mint(this.receiver, receiverInitialBalance);
        await expect(tx)
          .to.emit(this.token, 'Transfer')
          .withArgs(ethers.ZeroAddress, this.receiver, receiverInitialBalance);
        await expect(tx).to.changeTokenBalance(this.token, this.receiver, receiverInitialBalance);

        await this.token.setFlashFee(flashFee);
        expect(await this.token.flashFee(this.token, loanValue)).to.equal(flashFee);
      });

      it('default flash fee receiver', async function () {
        const tx = await this.token.flashLoan(this.receiver, this.token, loanValue, '0x');
        await expect(tx)
          .to.emit(this.token, 'Transfer')
          .withArgs(ethers.ZeroAddress, this.receiver, loanValue)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.receiver, ethers.ZeroAddress, loanValue + flashFee)
          .to.emit(this.receiver, 'BalanceOf')
          .withArgs(this.token, this.receiver, receiverInitialBalance + loanValue)
          .to.emit(this.receiver, 'TotalSupply')
          .withArgs(this.token, initialSupply + receiverInitialBalance + loanValue);
        await expect(tx).to.changeTokenBalances(this.token, [this.receiver, ethers.ZeroAddress], [-flashFee, 0]);

        expect(await this.token.totalSupply()).to.equal(initialSupply + receiverInitialBalance - flashFee);
        expect(await this.token.allowance(this.receiver, this.token)).to.equal(0n);
      });

      it('custom flash fee receiver', async function () {
        const flashFeeReceiverAddress = this.other;
        await this.token.setFlashFeeReceiver(flashFeeReceiverAddress);
        expect(await this.token.$_flashFeeReceiver()).to.equal(flashFeeReceiverAddress);

        const tx = await this.token.flashLoan(this.receiver, this.token, loanValue, '0x');
        await expect(tx)
          .to.emit(this.token, 'Transfer')
          .withArgs(ethers.ZeroAddress, this.receiver, loanValue)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.receiver, ethers.ZeroAddress, loanValue)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.receiver, flashFeeReceiverAddress, flashFee)
          .to.emit(this.receiver, 'BalanceOf')
          .withArgs(this.token, this.receiver, receiverInitialBalance + loanValue)
          .to.emit(this.receiver, 'TotalSupply')
          .withArgs(this.token, initialSupply + receiverInitialBalance + loanValue);
        await expect(tx).to.changeTokenBalances(
          this.token,
          [this.receiver, flashFeeReceiverAddress],
          [-flashFee, flashFee],
        );

        expect(await this.token.totalSupply()).to.equal(initialSupply + receiverInitialBalance);
        expect(await this.token.allowance(this.receiver, flashFeeReceiverAddress)).to.equal(0n);
      });
    });
  });
});
