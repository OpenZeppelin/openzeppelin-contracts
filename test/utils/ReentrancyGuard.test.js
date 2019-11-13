const { load } = require('@openzeppelin/test-env');
const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ReentrancyMock = load.fromArtifacts('ReentrancyMock');
const ReentrancyAttack = load.fromArtifacts('ReentrancyAttack');

describe('ReentrancyGuard', function () {
  beforeEach(async function () {
    this.reentrancyMock = await ReentrancyMock.new();
    expect(await this.reentrancyMock.counter()).to.be.bignumber.equal('0');
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
