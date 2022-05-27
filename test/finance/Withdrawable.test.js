const { balance, ether, expectEvent, send, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const Withdrawable = artifacts.require('WithdrawableMock');
const Token = artifacts.require('ERC20Mock');

contract('Withdrawable', function (accounts) {
  const [ owner ] = accounts;

  const zero = ether('0');
  const amount = ether('1');
  const biggerAmount = ether('10');
  const ownerFunds = ether('100');

  beforeEach(async function () {
    this.contract = await Withdrawable.new(owner);
    this.token = await Token.new('MyToken', 'MT', owner, ownerFunds);
  });

  context('Ether', function () {
    it('should throw an error when the amount is invalid', async function () {
      await expectRevert(
        this.contract.withdraw(zero),
        'Withdrawable: Invalid amount',
      );
    });

    it('should throw an error when there is no balance', async function () {
      await expectRevert(
        this.contract.withdraw(amount),
        'Withdrawable: Insuficient balance',
      );
    });

    it('should throw an error when the balance is lower then the desired amount', async function () {
      await send.ether(owner, this.contract.address, amount);
      await expectRevert(
        this.contract.withdraw(biggerAmount),
        'Withdrawable: Insuficient balance',
      );
    });

    it('should withdraw the amount from the contract', async function () {
      await send.ether(owner, this.contract.address, amount);
      const initialBalance = await balance.current(this.contract.address);

      const receipt = await this.contract.withdraw(amount);
      expectEvent(receipt, 'WithdrawalCompleted');

      const finalBalance = await balance.current(this.contract.address);
      expect(initialBalance).to.be.bignumber.greaterThan(finalBalance);
      expect(finalBalance).to.be.bignumber.equal(zero);
    });
  });

  context('Tokens', function () {
    it('should throw an error when the amount is invalid', async function () {
      await expectRevert(
        this.contract.withdrawTokens(this.token.address, zero),
        'Withdrawable: Invalid amount',
      );
    });

    it('should throw an error when there is no balance', async function () {
      await expectRevert(
        this.contract.withdrawTokens(this.token.address, amount),
        'Withdrawable: Insuficient balance',
      );
    });

    it('should throw an error when the balance is lower then the desired amount', async function () {
      await this.token.transferInternal(owner, this.contract.address, amount);
      await expectRevert(
        this.contract.withdrawTokens(this.token.address, biggerAmount),
        'Withdrawable: Insuficient balance',
      );
    });

    it('should withdraw the amount from the contract', async function () {
      await this.token.transferInternal(owner, this.contract.address, amount);
      const initialBalance = await this.token.balanceOf(this.contract.address);

      const receipt = await this.contract.withdrawTokens(this.token.address, amount);
      expectEvent(receipt, 'TokenWithdrawalCompleted');

      const finalBalance = await this.token.balanceOf(this.contract.address);
      expect(initialBalance).to.be.bignumber.greaterThan(finalBalance);
      expect(finalBalance).to.be.bignumber.equal(zero);
    });
  });
});
