const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { expectRevertCustomError } = require('../helpers/customError');

const ReentrancyMock = artifacts.require('ReentrancyMock');
const ReentrancyAttack = artifacts.require('ReentrancyAttack');

contract('ReentrancyGuard', function () {
  beforeEach(async function () {
    this.reentrancyMock = await ReentrancyMock.new();
    expect(await this.reentrancyMock.counter()).to.be.bignumber.equal('0');
  });

  it('nonReentrant function can be called', async function () {
    expect(await this.reentrancyMock.counter()).to.be.bignumber.equal('0');
    await this.reentrancyMock.callback();
    expect(await this.reentrancyMock.counter()).to.be.bignumber.equal('1');
  });

  it('does not allow remote callback', async function () {
    const attacker = await ReentrancyAttack.new();
    await expectRevert(this.reentrancyMock.countAndCall(attacker.address), 'ReentrancyAttack: failed call', []);
  });

  it('_reentrancyGuardEntered should be true when guarded', async function () {
    await this.reentrancyMock.guardedCheckEntered();
  });

  it('_reentrancyGuardEntered should be false when unguarded', async function () {
    await this.reentrancyMock.unguardedCheckNotEntered();
  });

  // The following are more side-effects than intended behavior:
  // I put them here as documentation, and to monitor any changes
  // in the side-effects.
  it('does not allow local recursion', async function () {
    await expectRevertCustomError(this.reentrancyMock.countLocalRecursive(10), 'ReentrancyGuardReentrantCall', []);
  });

  it('does not allow indirect local recursion', async function () {
    await expectRevert(this.reentrancyMock.countThisRecursive(10), 'ReentrancyMock: failed call', []);
  });
});
