const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const {
  getDomain,
  TransferWithAuthorization,
  ReceiveWithAuthorization,
  CancelAuthorization,
} = require('../../../helpers/eip712');
const time = require('../../../helpers/time');

const name = 'My Token';
const symbol = 'MTKN';
const version = '1';
const initialSupply = 100n;

const randomNonce = () => ethers.hexlify(ethers.randomBytes(32));

const fixture = async () => {
  const [holder, recipient, other] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC3009', [name, symbol, name, version]);
  await token.$_mint(holder, initialSupply);

  return { holder, recipient, other, token };
};

describe('ERC3009', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('authorizationState', function () {
    it('returns false for unused nonce', async function () {
      await expect(this.token.authorizationState(this.holder, randomNonce())).to.eventually.be.false;
    });

    it('returns true after the nonce is consumed', async function () {
      const nonce = randomNonce();
      const validAfter = 0n;
      const validBefore = ethers.MaxUint256;
      const value = 42n;

      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { TransferWithAuthorization },
            { from: this.holder.address, to: this.recipient.address, value, validAfter, validBefore, nonce },
          ),
        )
        .then(ethers.Signature.from);

      await this.token.transferWithAuthorization(
        this.holder,
        this.recipient,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
      );

      await expect(this.token.authorizationState(this.holder, nonce)).to.eventually.be.true;
    });
  });

  describe('transferWithAuthorization', function () {
    const value = 42n;

    beforeEach(async function () {
      this.nonce = randomNonce();
      this.validAfter = 0n;
      this.validBefore = ethers.MaxUint256;
    });

    it('accepts random nonces in any order', async function () {
      const nonceA = randomNonce();
      const nonceB = randomNonce();

      const sign = nonce =>
        getDomain(this.token)
          .then(domain =>
            this.holder.signTypedData(
              domain,
              { TransferWithAuthorization },
              {
                from: this.holder.address,
                to: this.recipient.address,
                value,
                validAfter: this.validAfter,
                validBefore: this.validBefore,
                nonce,
              },
            ),
          )
          .then(ethers.Signature.from);

      const sigA = await sign(nonceA);
      const sigB = await sign(nonceB);

      // Submit out of order to show that nonces are independent (no sequential constraint in base)
      await this.token.transferWithAuthorization(
        this.holder,
        this.recipient,
        value,
        this.validAfter,
        this.validBefore,
        nonceB,
        sigB.v,
        sigB.r,
        sigB.s,
      );
      await this.token.transferWithAuthorization(
        this.holder,
        this.recipient,
        value,
        this.validAfter,
        this.validBefore,
        nonceA,
        sigA.v,
        sigA.r,
        sigA.s,
      );

      await expect(this.token.authorizationState(this.holder, nonceA)).to.eventually.be.true;
      await expect(this.token.authorizationState(this.holder, nonceB)).to.eventually.be.true;
    });

    it('rejects reused nonce with ERC3009UsedAuthorization', async function () {
      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { TransferWithAuthorization },
            {
              from: this.holder.address,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        )
        .then(ethers.Signature.from);

      await this.token.transferWithAuthorization(
        this.holder,
        this.recipient,
        value,
        this.validAfter,
        this.validBefore,
        this.nonce,
        v,
        r,
        s,
      );

      await expect(
        this.token.transferWithAuthorization(
          this.holder,
          this.recipient,
          value,
          this.validAfter,
          this.validBefore,
          this.nonce,
          v,
          r,
          s,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009UsedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });

    it('rejects expired authorization using default clock', async function () {
      const validBefore = (await time.clock.timestamp()) - 5n;

      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { TransferWithAuthorization },
            {
              from: this.holder.address,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore,
              nonce: this.nonce,
            },
          ),
        )
        .then(ethers.Signature.from);

      await expect(
        this.token.transferWithAuthorization(
          this.holder,
          this.recipient,
          value,
          this.validAfter,
          validBefore,
          this.nonce,
          v,
          r,
          s,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009InvalidAuthorizationTime')
        .withArgs(this.validAfter, validBefore);
    });
  });

  describe('receiveWithAuthorization', function () {
    const value = 42n;

    beforeEach(async function () {
      this.nonce = randomNonce();
      this.validAfter = 0n;
      this.validBefore = ethers.MaxUint256;
    });

    it('rejects reused nonce with ERC3009UsedAuthorization', async function () {
      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { ReceiveWithAuthorization },
            {
              from: this.holder.address,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        )
        .then(ethers.Signature.from);

      await this.token
        .connect(this.recipient)
        .receiveWithAuthorization(
          this.holder,
          this.recipient,
          value,
          this.validAfter,
          this.validBefore,
          this.nonce,
          v,
          r,
          s,
        );

      await expect(
        this.token
          .connect(this.recipient)
          .receiveWithAuthorization(
            this.holder,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            v,
            r,
            s,
          ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009UsedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });
  });

  describe('cancelAuthorization', function () {
    beforeEach(async function () {
      this.nonce = randomNonce();
    });

    it('cancels an unused authorization', async function () {
      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { CancelAuthorization },
            { authorizer: this.holder.address, nonce: this.nonce },
          ),
        )
        .then(ethers.Signature.from);

      await expect(this.token.cancelAuthorization(this.holder, this.nonce, v, r, s))
        .to.emit(this.token, 'AuthorizationCanceled')
        .withArgs(this.holder.address, this.nonce);

      await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
    });

    it('rejects re-cancellation with ERC3009UsedAuthorization', async function () {
      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { CancelAuthorization },
            { authorizer: this.holder.address, nonce: this.nonce },
          ),
        )
        .then(ethers.Signature.from);

      await this.token.cancelAuthorization(this.holder, this.nonce, v, r, s);

      await expect(this.token.cancelAuthorization(this.holder, this.nonce, v, r, s))
        .to.be.revertedWithCustomError(this.token, 'ERC3009UsedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });
  });
});
