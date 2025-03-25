const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('ReentrancyGuard', function () {
    async function fixture() {
        const name = 'ReentrancyMock';
        const mock = await ethers.deployContract(name);
        return { name, mock };
    }

    beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
    });

    it('nonReentrant function can be called', async function () {
        expect(await this.mock.counter()).to.equal(0n);
        await this.mock.callback();
        expect(await this.mock.counter()).to.equal(1n);
    });

    it('does not allow remote callback', async function () {
        const attacker = await ethers.deployContract('ReentrancyAttack');
        await expect(this.mock.countAndCall(attacker)).to.be.revertedWith('ReentrancyAttack: failed call');
    });

    it('_reentrancyGuardEntered should be true when guarded', async function () {
        await this.mock.guardedCheckEntered();
    });

    it('_reentrancyGuardEntered should be false when unguarded', async function () {
        await this.mock.unguardedCheckNotEntered();
    });

    it('does not allow local recursion', async function () {
        await expect(this.mock.countLocalRecursive(10n)).to.be.revertedWithCustomError(
            this.mock,
            'ReentrancyGuardReentrantCall',
        );
    });

    it('does not allow indirect local recursion', async function () {
        await expect(this.mock.countThisRecursive(10n)).to.be.revertedWith('ReentrancyMock: failed call');
    });

    it('allows view function with nonReentrantView', async function () {
        await expect(this.mock.readOnlyFunction()).to.not.be.reverted;
    });

    it('reverts if called during reentrancy with nonReentrantView', async function () {
        const attacker = await ethers.deployContract('ReentrancyAttackHelper', [this.mock]);
        await expect(attacker.startAttack()).to.be.revertedWithCustomError(
            this.mock,
            'ReentrancyGuardReentrantCall',
        );
    });
});