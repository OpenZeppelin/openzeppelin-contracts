const { expectRevert } = require('openzeppelin-test-helpers');

const ReentrancyMock = artifacts.require('ReentrancyMock');
const ReentrancyAttack = artifacts.require('ReentrancyAttack');

contract('ReentrancyGuard', function () {
  beforeEach(async function () {
    this.reentrancyMock = await ReentrancyMock.new();
    (await this.reentrancyMock.counter()).should.be.bignumber.equal('0');
  });

  it('should not allow remote callback', async function () {
    const attacker = await ReentrancyAttack.new();
    await expectRevert(
      this.reentrancyMock.countAndCall(attacker.address), 'ReentrancyGuard: reentrant call');
  });

  // The following are more side-effects than intended behavior:
  // I put them here as documentation, and to monitor any changes
  // in the side-effects.

  it('should not allow local recursion', async function () {
    await expectRevert(
      this.reentrancyMock.countLocalRecursive(10), 'ReentrancyGuard: reentrant call'
    );
  });

  it('should not allow indirect local recursion', async function () {
    await expectRevert(
      this.reentrancyMock.countThisRecursive(10), 'ReentrancyMock: failed call'
    );
  });
});
