const { ethers } = require('hardhat');
const { expect } = require('chai');

function shouldBehaveLikeNonces() {
  describe('should behave like Nonces', function () {
    const sender = ethers.Wallet.createRandom();
    const other = ethers.Wallet.createRandom();

    it('gets a nonce', async function () {
      expect(await this.mock.nonces(sender)).to.equal(0n);
    });

    describe('_useNonce', function () {
      it('increments a nonce', async function () {
        expect(await this.mock.nonces(sender)).to.equal(0n);

        const eventName = ['return$_useNonce', 'return$_useNonce_address'].find(name =>
          this.mock.interface.getEvent(name),
        );

        await expect(await this.mock.$_useNonce(sender))
          .to.emit(this.mock, eventName)
          .withArgs(0n);

        expect(await this.mock.nonces(sender)).to.equal(1n);
      });

      it("increments only sender's nonce", async function () {
        expect(await this.mock.nonces(sender)).to.equal(0n);
        expect(await this.mock.nonces(other)).to.equal(0n);

        await this.mock.$_useNonce(sender);

        expect(await this.mock.nonces(sender)).to.equal(1n);
        expect(await this.mock.nonces(other)).to.equal(0n);
      });
    });

    describe('_useCheckedNonce', function () {
      it('increments a nonce', async function () {
        const currentNonce = await this.mock.nonces(sender);

        expect(currentNonce).to.equal(0n);

        await this.mock.$_useCheckedNonce(sender, currentNonce);

        expect(await this.mock.nonces(sender)).to.equal(1n);
      });

      it("increments only sender's nonce", async function () {
        const currentNonce = await this.mock.nonces(sender);

        expect(currentNonce).to.equal(0n);
        expect(await this.mock.nonces(other)).to.equal(0n);

        await this.mock.$_useCheckedNonce(sender, currentNonce);

        expect(await this.mock.nonces(sender)).to.equal(1n);
        expect(await this.mock.nonces(other)).to.equal(0n);
      });

      it('reverts when nonce is not the expected', async function () {
        const currentNonce = await this.mock.nonces(sender);

        await expect(this.mock.$_useCheckedNonce(sender, currentNonce + 1n))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, currentNonce);
      });
    });
  });
}

function shouldBehaveLikeNoncesSemiAbstracted() {
  describe("should implement ERC-4337's semi-abstracted nonces", function () {
    const sender = ethers.Wallet.createRandom();

    const keyOffset = key => key << 64n;

    it('gets a nonce', async function () {
      expect(await this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.equal(keyOffset(0n) + 0n);
      expect(await this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.equal(keyOffset(17n) + 0n);
    });

    describe('_useNonce', function () {
      it('default variant uses key 0', async function () {
        expect(await this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.equal(keyOffset(0n) + 0n);
        expect(await this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.equal(keyOffset(17n) + 0n);

        await expect(await this.mock.$_useNonce(sender))
          .to.emit(this.mock, 'return$_useNonce_address')
          .withArgs(0n);

        await expect(await this.mock.$_useNonce(sender, ethers.Typed.uint192(0n)))
          .to.emit(this.mock, 'return$_useNonce_address_uint192')
          .withArgs(1n);

        expect(await this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.equal(keyOffset(0n) + 2n);
        expect(await this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.equal(keyOffset(17n) + 0n);
      });

      it('use nonce at another key', async function () {
        expect(await this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.equal(keyOffset(0n) + 0n);
        expect(await this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.equal(keyOffset(17n) + 0n);

        await expect(await this.mock.$_useNonce(sender, ethers.Typed.uint192(17n)))
          .to.emit(this.mock, 'return$_useNonce_address_uint192')
          .withArgs(0n);

        await expect(await this.mock.$_useNonce(sender, ethers.Typed.uint192(17n)))
          .to.emit(this.mock, 'return$_useNonce_address_uint192')
          .withArgs(1n);

        expect(await this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.equal(keyOffset(0n) + 0n);
        expect(await this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.equal(keyOffset(17n) + 2n);
      });
    });

    describe('_useCheckedNonce', function () {
      it('default variant uses key 0', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(0n));

        await this.mock.$_useCheckedNonce(sender, currentNonce);

        expect(await this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.equal(currentNonce + 1n);
      });

      it('use nonce at another key', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(17n));

        await this.mock.$_useCheckedNonce(sender, currentNonce);

        expect(await this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.equal(currentNonce + 1n);
      });

      it('reverts when nonce is not the expected', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(42n));

        // use and increment
        await this.mock.$_useCheckedNonce(sender, currentNonce);

        // reuse same nonce
        await expect(this.mock.$_useCheckedNonce(sender, currentNonce))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, 1);

        // use "future" nonce too early
        await expect(this.mock.$_useCheckedNonce(sender, currentNonce + 10n))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, 1);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeNonces,
  shouldBehaveLikeNoncesSemiAbstracted,
};
