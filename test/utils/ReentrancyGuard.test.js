const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

for (const variant of ['', 'Transient']) {
  describe(`Reentrancy${variant}Guard`, function () {
    async function fixture() {
      const name = `Reentrancy${variant}Mock`;
      const mock = await ethers.deployContract(name);
      const attacker = await ethers.deployContract('ReentrancyAttack');
      return { name, mock, attacker };
    }

    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    it('nonReentrant function can be called', async function () {
      expect(await this.mock.counter()).to.equal(0n);
      await this.mock.callback();
      expect(await this.mock.counter()).to.equal(1n);
    });

    it('nonReentrantView function can be called', async function () {
      await this.mock.viewCallback();
    });

    it('does not allow remote callback to nonReentrant function', async function () {
      await expect(this.mock.countAndCall(this.attacker)).to.be.revertedWith('ReentrancyAttack: failed call');
    });

    it('does not allow remote callback to nonReentrantView function', async function () {
      await expect(this.mock.countAndCallView(this.attacker)).to.be.revertedWith('ReentrancyAttack: failed call');
    });

    it('_reentrancyGuardEntered should be true when guarded', async function () {
      await this.mock.guardedCheckEntered();
    });

    it('_reentrancyGuardEntered should be false when unguarded', async function () {
      await this.mock.unguardedCheckNotEntered();
    });

    // The following are more side-effects than intended behavior:
    // I put them here as documentation, and to monitor any changes
    // in the side-effects.
    it('does not allow local recursion', async function () {
      await expect(this.mock.countLocalRecursive(10n)).to.be.revertedWithCustomError(
        this.mock,
        'ReentrancyGuardReentrantCall',
      );
    });

    it('does not allow indirect local recursion', async function () {
      await expect(this.mock.countThisRecursive(10n)).to.be.revertedWith(`${this.name}: failed call`);
    });
  });
}
