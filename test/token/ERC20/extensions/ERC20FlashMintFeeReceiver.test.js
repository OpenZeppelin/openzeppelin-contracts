/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const ERC20FlashMintFeeReceiverMock = artifacts.require('ERC20FlashMintFeeReceiverMock');
const ERC3156FlashBorrowerMock = artifacts.require('ERC3156FlashBorrowerMock');

contract('ERC20FlashMintFeeReceiver', function (accounts) {
  const [ initialHolder, other ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  const initialSupply = new BN(100);
  const loanAmount = new BN(10000000000000);

  const flashFee = new BN(5000);

  beforeEach(async function () {
    this.token = await ERC20FlashMintFeeReceiverMock.new(name, symbol, initialHolder, initialSupply);
  });

  describe('flashFee', function () {
    it('token amount', async function () {
      expect(await this.token.flashFee(this.token.address, loanAmount)).to.be.bignumber.equal(flashFee);
    });
  });

  describe('mockFlashFeeReceiver', function () {
    it('fee receiver', async function () {
      expect(await this.token.mockFlashFeeReceiver(this.token.address)).to.be.eq(this.token.address);
    });
  });

  describe('flashLoan', function () {
    it('transfered fee', async function () {
      const receiver = await ERC3156FlashBorrowerMock.new(true, true);
      const receiverInitialBalance = new BN(200000);
      
      const receipt = await this.token.mint(receiver.address, receiverInitialBalance);
      await expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: receiver.address, value: receiverInitialBalance });

      expect(await this.token.balanceOf(this.token.address)).to.be.bignumber.equal('0');
      expect(await this.token.balanceOf(receiver.address)).to.be.bignumber.equal(receiverInitialBalance);
      
      const { tx } = await this.token.flashLoan(receiver.address, this.token.address, loanAmount, '0x');
      await expectEvent.inTransaction(tx, this.token, 'Transfer', { from: ZERO_ADDRESS, to: receiver.address, value: loanAmount });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', { from: receiver.address, to: ZERO_ADDRESS, value: loanAmount });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', { from: receiver.address, to: this.token.address, value: flashFee });
      await expectEvent.inTransaction(tx, receiver, 'BalanceOf', { token: this.token.address, account: receiver.address, value: receiverInitialBalance.add(loanAmount) });
      await expectEvent.inTransaction(tx, receiver, 'TotalSupply', { token: this.token.address, value: initialSupply.add(receiverInitialBalance).add(loanAmount) });

      expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply.add(receiverInitialBalance));
      expect(await this.token.balanceOf(receiver.address)).to.be.bignumber.equal(receiverInitialBalance.sub(flashFee));
      expect(await this.token.balanceOf(this.token.address)).to.be.bignumber.equal(flashFee);
      expect(await this.token.allowance(receiver.address, this.token.address)).to.be.bignumber.equal('0');
    });
  });
});
