/* eslint-disable */

const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { expectRevertCustomError } = require('../../../helpers/customError');
const { MAX_UINT256, ZERO_ADDRESS } = constants;

const ERC20FlashMintMock = artifacts.require('$ERC20FlashMintMock');
const ERC3156FlashBorrowerMock = artifacts.require('ERC3156FlashBorrowerMock');

contract('ERC20FlashMint', function (accounts) {
  const [initialHolder, other, anotherAccount] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  const initialSupply = new BN(100);
  const loanValue = new BN(10000000000000);

  beforeEach(async function () {
    this.token = await ERC20FlashMintMock.new(name, symbol);
    await this.token.$_mint(initialHolder, initialSupply);
  });

  describe('maxFlashLoan', function () {
    it('token match', async function () {
      expect(await this.token.maxFlashLoan(this.token.address)).to.be.bignumber.equal(MAX_UINT256.sub(initialSupply));
    });

    it('token mismatch', async function () {
      expect(await this.token.maxFlashLoan(ZERO_ADDRESS)).to.be.bignumber.equal('0');
    });
  });

  describe('flashFee', function () {
    it('token match', async function () {
      expect(await this.token.flashFee(this.token.address, loanValue)).to.be.bignumber.equal('0');
    });

    it('token mismatch', async function () {
      await expectRevertCustomError(this.token.flashFee(ZERO_ADDRESS, loanValue), 'ERC3156UnsupportedToken', [
        ZERO_ADDRESS,
      ]);
    });
  });

  describe('flashFeeReceiver', function () {
    it('default receiver', async function () {
      expect(await this.token.$_flashFeeReceiver()).to.be.eq(ZERO_ADDRESS);
    });
  });

  describe('flashLoan', function () {
    it('success', async function () {
      const receiver = await ERC3156FlashBorrowerMock.new(true, true);
      const { tx } = await this.token.flashLoan(receiver.address, this.token.address, loanValue, '0x');

      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: ZERO_ADDRESS,
        to: receiver.address,
        value: loanValue,
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: receiver.address,
        to: ZERO_ADDRESS,
        value: loanValue,
      });
      await expectEvent.inTransaction(tx, receiver, 'BalanceOf', {
        token: this.token.address,
        account: receiver.address,
        value: loanValue,
      });
      await expectEvent.inTransaction(tx, receiver, 'TotalSupply', {
        token: this.token.address,
        value: initialSupply.add(loanValue),
      });

      expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
      expect(await this.token.balanceOf(receiver.address)).to.be.bignumber.equal('0');
      expect(await this.token.allowance(receiver.address, this.token.address)).to.be.bignumber.equal('0');
    });

    it('missing return value', async function () {
      const receiver = await ERC3156FlashBorrowerMock.new(false, true);
      await expectRevertCustomError(
        this.token.flashLoan(receiver.address, this.token.address, loanValue, '0x'),
        'ERC3156InvalidReceiver',
        [receiver.address],
      );
    });

    it('missing approval', async function () {
      const receiver = await ERC3156FlashBorrowerMock.new(true, false);
      await expectRevertCustomError(
        this.token.flashLoan(receiver.address, this.token.address, loanValue, '0x'),
        'ERC20InsufficientAllowance',
        [this.token.address, 0, loanValue],
      );
    });

    it('unavailable funds', async function () {
      const receiver = await ERC3156FlashBorrowerMock.new(true, true);
      const data = this.token.contract.methods.transfer(other, 10).encodeABI();
      await expectRevertCustomError(
        this.token.flashLoan(receiver.address, this.token.address, loanValue, data),
        'ERC20InsufficientBalance',
        [receiver.address, loanValue - 10, loanValue],
      );
    });

    it('more than maxFlashLoan', async function () {
      const receiver = await ERC3156FlashBorrowerMock.new(true, true);
      const data = this.token.contract.methods.transfer(other, 10).encodeABI();
      // _mint overflow reverts using a panic code. No reason string.
      await expectRevert.unspecified(this.token.flashLoan(receiver.address, this.token.address, MAX_UINT256, data));
    });

    describe('custom flash fee & custom fee receiver', function () {
      const receiverInitialBalance = new BN(200000);
      const flashFee = new BN(5000);

      beforeEach('init receiver balance & set flash fee', async function () {
        this.receiver = await ERC3156FlashBorrowerMock.new(true, true);
        const receipt = await this.token.$_mint(this.receiver.address, receiverInitialBalance);
        await expectEvent(receipt, 'Transfer', {
          from: ZERO_ADDRESS,
          to: this.receiver.address,
          value: receiverInitialBalance,
        });
        expect(await this.token.balanceOf(this.receiver.address)).to.be.bignumber.equal(receiverInitialBalance);

        await this.token.setFlashFee(flashFee);
        expect(await this.token.flashFee(this.token.address, loanValue)).to.be.bignumber.equal(flashFee);
      });

      it('default flash fee receiver', async function () {
        const { tx } = await this.token.flashLoan(this.receiver.address, this.token.address, loanValue, '0x');
        await expectEvent.inTransaction(tx, this.token, 'Transfer', {
          from: ZERO_ADDRESS,
          to: this.receiver.address,
          value: loanValue,
        });
        await expectEvent.inTransaction(tx, this.token, 'Transfer', {
          from: this.receiver.address,
          to: ZERO_ADDRESS,
          value: loanValue.add(flashFee),
        });
        await expectEvent.inTransaction(tx, this.receiver, 'BalanceOf', {
          token: this.token.address,
          account: this.receiver.address,
          value: receiverInitialBalance.add(loanValue),
        });
        await expectEvent.inTransaction(tx, this.receiver, 'TotalSupply', {
          token: this.token.address,
          value: initialSupply.add(receiverInitialBalance).add(loanValue),
        });

        expect(await this.token.totalSupply()).to.be.bignumber.equal(
          initialSupply.add(receiverInitialBalance).sub(flashFee),
        );
        expect(await this.token.balanceOf(this.receiver.address)).to.be.bignumber.equal(
          receiverInitialBalance.sub(flashFee),
        );
        expect(await this.token.balanceOf(await this.token.$_flashFeeReceiver())).to.be.bignumber.equal('0');
        expect(await this.token.allowance(this.receiver.address, this.token.address)).to.be.bignumber.equal('0');
      });

      it('custom flash fee receiver', async function () {
        const flashFeeReceiverAddress = anotherAccount;
        await this.token.setFlashFeeReceiver(flashFeeReceiverAddress);
        expect(await this.token.$_flashFeeReceiver()).to.be.eq(flashFeeReceiverAddress);

        expect(await this.token.balanceOf(flashFeeReceiverAddress)).to.be.bignumber.equal('0');

        const { tx } = await this.token.flashLoan(this.receiver.address, this.token.address, loanValue, '0x');
        await expectEvent.inTransaction(tx, this.token, 'Transfer', {
          from: ZERO_ADDRESS,
          to: this.receiver.address,
          value: loanValue,
        });
        await expectEvent.inTransaction(tx, this.token, 'Transfer', {
          from: this.receiver.address,
          to: ZERO_ADDRESS,
          value: loanValue,
        });
        await expectEvent.inTransaction(tx, this.token, 'Transfer', {
          from: this.receiver.address,
          to: flashFeeReceiverAddress,
          value: flashFee,
        });
        await expectEvent.inTransaction(tx, this.receiver, 'BalanceOf', {
          token: this.token.address,
          account: this.receiver.address,
          value: receiverInitialBalance.add(loanValue),
        });
        await expectEvent.inTransaction(tx, this.receiver, 'TotalSupply', {
          token: this.token.address,
          value: initialSupply.add(receiverInitialBalance).add(loanValue),
        });

        expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.add(receiverInitialBalance));
        expect(await this.token.balanceOf(this.receiver.address)).to.be.bignumber.equal(
          receiverInitialBalance.sub(flashFee),
        );
        expect(await this.token.balanceOf(flashFeeReceiverAddress)).to.be.bignumber.equal(flashFee);
        expect(await this.token.allowance(this.receiver.address, flashFeeReceiverAddress)).to.be.bignumber.equal('0');
      });
    });
  });
});
