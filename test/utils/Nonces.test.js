const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const Nonces = '$Nonces';

async function fixture() {
  const [sender, other] = await ethers.getSigners();

  const nonces = await ethers.deployContract(Nonces);

  return { sender, other, nonces };
}

describe('Nonces', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('gets a nonce', async function () {
    expect(await this.nonces.nonces(this.sender)).to.be.equal('0');
  });

  describe('_useNonce', function () {
    it('increments a nonce', async function () {
      expect(await this.nonces.nonces(this.sender)).to.be.equal('0');

      const tx = await this.nonces.$_useNonce(this.sender);
      await expect(tx).to.emit(this.nonces, 'return$_useNonce').withArgs('0');

      expect(await this.nonces.nonces(this.sender)).to.be.equal('1');
    });

    it("increments only sender's nonce", async function () {
      expect(await this.nonces.nonces(this.sender)).to.be.equal('0');
      expect(await this.nonces.nonces(this.other)).to.be.equal('0');

      await this.nonces.$_useNonce(this.sender);

      expect(await this.nonces.nonces(this.sender)).to.be.equal('1');
      expect(await this.nonces.nonces(this.other)).to.be.equal('0');
    });
  });

  describe('_useCheckedNonce', function () {
    it('increments a nonce', async function () {
      const currentNonce = await this.nonces.nonces(this.sender);
      expect(currentNonce).to.be.equal('0');

      await this.nonces.$_useCheckedNonce(this.sender, currentNonce);

      expect(await this.nonces.nonces(this.sender)).to.be.equal('1');
    });

    it("increments only sender's nonce", async function () {
      const currentNonce = await this.nonces.nonces(this.sender);

      expect(currentNonce).to.be.equal('0');
      expect(await this.nonces.nonces(this.other)).to.be.equal('0');

      await this.nonces.$_useCheckedNonce(this.sender, currentNonce);

      expect(await this.nonces.nonces(this.sender)).to.be.equal('1');
      expect(await this.nonces.nonces(this.other)).to.be.equal('0');
    });

    it('reverts when nonce is not the expected', async function () {
      const currentNonce = await this.nonces.nonces(this.sender);
      await expect(this.nonces.$_useCheckedNonce(this.sender, currentNonce + 1n))
        .to.be.revertedWithCustomError(this.nonces, 'InvalidAccountNonce')
        .withArgs(this.sender.address, currentNonce);
    });
  });
});
