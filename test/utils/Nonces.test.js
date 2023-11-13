const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [sender, other] = await ethers.getSigners();

  const nonces = await ethers.deployContract('$Nonces');

  return { sender, other, nonces };
}

describe('Nonces', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('gets a nonce', async function () {
    expect(await this.nonces.nonces(this.sender)).to.be.equal(0n);
  });

  describe('_useNonce', function () {
    it('increments a nonce', async function () {
      expect(await this.nonces.nonces(this.sender)).to.be.equal(0n);

      await expect(await this.nonces.$_useNonce(this.sender))
        .to.emit(this.nonces, 'return$_useNonce')
        .withArgs(0n);

      expect(await this.nonces.nonces(this.sender)).to.be.equal(1n);
    });

    it("increments only sender's nonce", async function () {
      expect(await this.nonces.nonces(this.sender)).to.be.equal(0n);
      expect(await this.nonces.nonces(this.other)).to.be.equal(0n);

      await this.nonces.$_useNonce(this.sender);

      expect(await this.nonces.nonces(this.sender)).to.be.equal(1n);
      expect(await this.nonces.nonces(this.other)).to.be.equal(0n);
    });
  });

  describe('_useCheckedNonce', function () {
    it('increments a nonce', async function () {
      const currentNonce = await this.nonces.nonces(this.sender);
      expect(currentNonce).to.be.equal(0n);

      await this.nonces.$_useCheckedNonce(this.sender, currentNonce);

      expect(await this.nonces.nonces(this.sender)).to.be.equal(1n);
    });

    it("increments only sender's nonce", async function () {
      const currentNonce = await this.nonces.nonces(this.sender);

      expect(currentNonce).to.be.equal(0n);
      expect(await this.nonces.nonces(this.other)).to.be.equal(0n);

      await this.nonces.$_useCheckedNonce(this.sender, currentNonce);

      expect(await this.nonces.nonces(this.sender)).to.be.equal(1n);
      expect(await this.nonces.nonces(this.other)).to.be.equal(0n);
    });

    it('reverts when nonce is not the expected', async function () {
      const currentNonce = await this.nonces.nonces(this.sender);
      await expect(this.nonces.$_useCheckedNonce(this.sender, currentNonce + 1n))
        .to.be.revertedWithCustomError(this.nonces, 'InvalidAccountNonce')
        .withArgs(this.sender.address, currentNonce);
    });
  });
});
