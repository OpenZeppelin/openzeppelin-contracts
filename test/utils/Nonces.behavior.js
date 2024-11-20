const { ethers } = require('hardhat');
const { expect } = require('chai');

function shouldBehaveLikeNonces() {
  describe('should behave like Nonces', function () {
    const sender = ethers.Wallet.createRandom();
    const other = ethers.Wallet.createRandom();

    it('gets a nonce', async function () {
      expect(this.mock.nonces(sender)).to.eventually.equal(0n);
    });

    describe('_useNonce', function () {
      it('increments a nonce', async function () {
        expect(this.mock.nonces(sender)).to.eventually.equal(0n);

        const eventName = ['return$_useNonce', 'return$_useNonce_address'].find(name =>
          this.mock.interface.getEvent(name),
        );

        await expect(this.mock.$_useNonce(sender)).to.emit(this.mock, eventName).withArgs(0n);

        expect(this.mock.nonces(sender)).to.eventually.equal(1n);
      });

      it("increments only sender's nonce", async function () {
        expect(this.mock.nonces(sender)).to.eventually.equal(0n);
        expect(this.mock.nonces(other)).to.eventually.equal(0n);

        await this.mock.$_useNonce(sender);

        expect(this.mock.nonces(sender)).to.eventually.equal(1n);
        expect(this.mock.nonces(other)).to.eventually.equal(0n);
      });
    });

    describe('_useCheckedNonce', function () {
      it('increments a nonce', async function () {
        // current nonce is 0n
        expect(this.mock.nonces(sender)).to.eventually.equal(0n);

        await this.mock.$_useCheckedNonce(sender, 0n);

        expect(this.mock.nonces(sender)).to.eventually.equal(1n);
      });

      it("increments only sender's nonce", async function () {
        // current nonce is 0n
        expect(this.mock.nonces(sender)).to.eventually.equal(0n);
        expect(this.mock.nonces(other)).to.eventually.equal(0n);

        await this.mock.$_useCheckedNonce(sender, 0n);

        expect(this.mock.nonces(sender)).to.eventually.equal(1n);
        expect(this.mock.nonces(other)).to.eventually.equal(0n);
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

function shouldBehaveLikeNoncesKeyed() {
  describe('should support nonces with keys', function () {
    const sender = ethers.Wallet.createRandom();

    const keyOffset = key => key << 64n;

    it('gets a nonce', async function () {
      expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(keyOffset(0n) + 0n);
      expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(keyOffset(17n) + 0n);
    });

    describe('_useNonce', function () {
      it('default variant uses key 0', async function () {
        expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(keyOffset(0n) + 0n);
        expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(keyOffset(17n) + 0n);

        await expect(this.mock.$_useNonce(sender)).to.emit(this.mock, 'return$_useNonce_address').withArgs(0n);

        await expect(this.mock.$_useNonce(sender, ethers.Typed.uint192(0n)))
          .to.emit(this.mock, 'return$_useNonce_address_uint192')
          .withArgs(keyOffset(0n) + 1n);

        expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(keyOffset(0n) + 2n);
        expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(keyOffset(17n) + 0n);
      });

      it('use nonce at another key', async function () {
        expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(keyOffset(0n) + 0n);
        expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(keyOffset(17n) + 0n);

        await expect(this.mock.$_useNonce(sender, ethers.Typed.uint192(17n)))
          .to.emit(this.mock, 'return$_useNonce_address_uint192')
          .withArgs(keyOffset(17n) + 0n);

        await expect(this.mock.$_useNonce(sender, ethers.Typed.uint192(17n)))
          .to.emit(this.mock, 'return$_useNonce_address_uint192')
          .withArgs(keyOffset(17n) + 1n);

        expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(keyOffset(0n) + 0n);
        expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(keyOffset(17n) + 2n);
      });
    });

    describe('_useCheckedNonce(address, uint256)', function () {
      it('default variant uses key 0', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(0n));

        await this.mock.$_useCheckedNonce(sender, currentNonce);

        expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(currentNonce + 1n);
      });

      it('use nonce at another key', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(17n));

        await this.mock.$_useCheckedNonce(sender, currentNonce);

        expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(currentNonce + 1n);
      });

      it('reverts when nonce is not the expected', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(42n));

        // use and increment
        await this.mock.$_useCheckedNonce(sender, currentNonce);

        // reuse same nonce
        await expect(this.mock.$_useCheckedNonce(sender, currentNonce))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, currentNonce + 1n);

        // use "future" nonce too early
        await expect(this.mock.$_useCheckedNonce(sender, currentNonce + 10n))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, currentNonce + 1n);
      });
    });

    describe('_useCheckedNonce(address, uint192, uint64)', function () {
      const MASK = 0xffffffffffffffffn;

      it('default variant uses key 0', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(0n));

        await this.mock.$_useCheckedNonce(sender, ethers.Typed.uint192(0n), currentNonce);

        expect(this.mock.nonces(sender, ethers.Typed.uint192(0n))).to.eventually.equal(currentNonce + 1n);
      });

      it('use nonce at another key', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(17n));

        await this.mock.$_useCheckedNonce(sender, ethers.Typed.uint192(17n), currentNonce & MASK);

        expect(this.mock.nonces(sender, ethers.Typed.uint192(17n))).to.eventually.equal(currentNonce + 1n);
      });

      it('reverts when nonce is not the expected', async function () {
        const currentNonce = await this.mock.nonces(sender, ethers.Typed.uint192(42n));

        // use and increment
        await this.mock.$_useCheckedNonce(sender, ethers.Typed.uint192(42n), currentNonce & MASK);

        // reuse same nonce
        await expect(this.mock.$_useCheckedNonce(sender, ethers.Typed.uint192(42n), currentNonce & MASK))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, currentNonce + 1n);

        // use "future" nonce too early
        await expect(this.mock.$_useCheckedNonce(sender, ethers.Typed.uint192(42n), (currentNonce & MASK) + 10n))
          .to.be.revertedWithCustomError(this.mock, 'InvalidAccountNonce')
          .withArgs(sender, currentNonce + 1n);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeNonces,
  shouldBehaveLikeNoncesKeyed,
};
