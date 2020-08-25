const { contract } = require('@openzeppelin/test-environment');
const { expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ReentrancyMock = contract.fromArtifact('ReentrancyMock');
const ReentrancyAttack = contract.fromArtifact('ReentrancyAttack');

describe('ReentrancyGuard', function () {
  beforeEach(async function () {
    this.reentrancyMock = await ReentrancyMock.new();
    expect(await this.reentrancyMock.counter()).to.be.bignumber.equal('0');
  });

  it('does not allow remote callback', async function () {
    const attacker = await ReentrancyAttack.new();
    await expectRevert(
      this.reentrancyMock.countAndCall(attacker.address), 'ReentrancyAttack: failed call');
  });

  // The following are more side-effects than intended behavior:
  // I put them here as documentation, and to monitor any changes
  // in the side-effects.
  it('does not allow local recursion', async function () {
    await expectRevert(
      this.reentrancyMock.countLocalRecursive(10), 'ReentrancyGuard: reentrant call'
    );
  });

  it('does not allow indirect local recursion', async function () {
    await expectRevert(
      this.reentrancyMock.countThisRecursive(10), 'ReentrancyMock: failed call'
    );
  });
});
