const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const FlashLoanMock = artifacts.require('FlashLoanMock');
const FlashLoanAttack = artifacts.require('FlashLoanAttack');

contract('FlashLoanGuard', function (accounts) {
  beforeEach(async function () {
    this.flashLoanMock = await FlashLoanMock.new();
    expect(await this.flashLoanMock.counter()).to.be.bignumber.equal('0');
  });

  it('allow unguarded function to increase ctr', async function () {
    const attacker = await FlashLoanAttack.new();
    await attacker.increaseUnsafe(this.flashLoanMock.address);
    expect(await this.flashLoanMock.counter()).to.be.bignumber.equal('3');
  });

  it('prevent guarded function to increase ctr', async function () {
    const attacker = await FlashLoanAttack.new();
    await expectRevert(
      attacker.increaseSafe(this.flashLoanMock.address),
      'FlashLoanGuard: too many calls in same block',
    );
  });
});
