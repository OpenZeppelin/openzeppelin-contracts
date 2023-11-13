const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const ReentrancyMock = 'ReentrancyMock';
const ReentrancyAttack = 'ReentrancyAttack';

async function fixture() {
  const reentrancyMock = await ethers.deployContract(ReentrancyMock);
  expect(await reentrancyMock.counter()).to.be.equal('0');

  return { reentrancyMock };
}

describe('ReentrancyGuard', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('nonReentrant function can be called', async function () {
    expect(await this.reentrancyMock.counter()).to.be.equal('0');
    await this.reentrancyMock.callback();
    expect(await this.reentrancyMock.counter()).to.be.equal('1');
  });

  it('does not allow remote callback', async function () {
    const attacker = await ethers.deployContract(ReentrancyAttack);
    await expect(this.reentrancyMock.countAndCall(attacker)).to.be.revertedWith('ReentrancyAttack: failed call');
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
    await expect(this.reentrancyMock.countLocalRecursive(10)).to.be.revertedWithCustomError(
      this.reentrancyMock,
      'ReentrancyGuardReentrantCall',
    );
  });

  it('does not allow indirect local recursion', async function () {
    await expect(this.reentrancyMock.countThisRecursive(10)).to.be.revertedWith('ReentrancyMock: failed call');
  });
});
