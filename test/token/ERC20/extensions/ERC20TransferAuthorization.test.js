const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const {
  getDomain,
  domainSeparator,
  TransferWithAuthorization,
  ReceiveWithAuthorization,
  CancelAuthorization,
} = require('../../../helpers/eip712');
const time = require('../../../helpers/time');

const name = 'My Token';
const symbol = 'MTKN';
const initialSupply = 100n;

async function fixture() {
  const [holder, recipient, other] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC20TransferAuthorization', [name, symbol, name]);
  await token.$_mint(holder, initialSupply);

  const wallet = await ethers.deployContract('ERC1271WalletMock', [holder]);
  await token.$_mint(wallet, initialSupply);

  return {
    holder,
    recipient,
    other,
    token,
    wallet,
  };
}

describe('ERC20TransferAuthorization', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('domain separator', async function () {
    await expect(this.token.DOMAIN_SEPARATOR()).to.eventually.equal(await getDomain(this.token).then(domainSeparator));
  });

  describe('authorizationState', function () {
    it('returns false for unused nonce', async function () {
      const nonce = ethers.hexlify(ethers.randomBytes(32));
      await expect(this.token.authorizationState(this.holder, nonce)).to.eventually.be.false;
    });
  });

  describe('transferWithAuthorization', function () {
    const value = 42n;

    beforeEach(async function () {
      this.nonce = ethers.hexlify(ethers.randomBytes(32));
      this.validAfter = 0n;
      this.validBefore = ethers.MaxUint256;

      this.buildData = (contract, from, to, validBefore = this.validBefore, nonce = this.nonce) =>
        getDomain(contract).then(domain => ({
          domain,
          types: { TransferWithAuthorization },
          message: {
            from: from.address,
            to: to.address,
            value,
            validAfter: this.validAfter,
            validBefore,
            nonce,
          },
        }));
    });

    it('accepts holder signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

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
        .to.emit(this.token, 'AuthorizationUsed')
        .withArgs(this.holder.address, this.nonce)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.recipient.address, value);

      await expect(this.token.balanceOf(this.holder)).to.eventually.equal(initialSupply - value);
      await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(value);
      await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
    });

    it('rejects reused signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
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
        .to.be.revertedWithCustomError(this.token, 'ERC3009ConsumedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });

    it('rejects other signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.other.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

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
      ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
    });

    it('rejects authorization not yet valid', async function () {
      const validAfter = (await time.clock.timestamp()) + time.duration.weeks(1);

      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { TransferWithAuthorization },
            {
              from: this.holder.address,
              to: this.recipient.address,
              value,
              validAfter,
              validBefore: this.validBefore,
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
          validAfter,
          this.validBefore,
          this.nonce,
          v,
          r,
          s,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009InvalidAuthorizationTime')
        .withArgs(validAfter, this.validBefore);
    });

    it('rejects expired authorization', async function () {
      const validBefore = (await time.clock.timestamp()) - time.duration.weeks(1);

      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient, validBefore)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
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

    it('works with different nonces in parallel', async function () {
      const nonce1 = ethers.hexlify(ethers.randomBytes(32));
      const nonce2 = ethers.hexlify(ethers.randomBytes(32));

      const {
        v: v1,
        r: r1,
        s: s1,
      } = await this.buildData(this.token, this.holder, this.recipient, this.validBefore, nonce1)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      const {
        v: v2,
        r: r2,
        s: s2,
      } = await this.buildData(this.token, this.holder, this.recipient, this.validBefore, nonce2)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      // Submit in reverse order to show non-sequential nonces work
      await this.token.transferWithAuthorization(
        this.holder,
        this.recipient,
        value,
        this.validAfter,
        this.validBefore,
        nonce2,
        v2,
        r2,
        s2,
      );
      await this.token.transferWithAuthorization(
        this.holder,
        this.recipient,
        value,
        this.validAfter,
        this.validBefore,
        nonce1,
        v1,
        r1,
        s1,
      );

      await expect(this.token.authorizationState(this.holder, nonce1)).to.eventually.be.true;
      await expect(this.token.authorizationState(this.holder, nonce2)).to.eventually.be.true;
    });

    describe('with bytes signature', function () {
      it('accepts holder signature', async function () {
        const signature = await this.buildData(this.token, this.holder, this.recipient).then(
          ({ domain, types, message }) => this.holder.signTypedData(domain, types, message),
        );

        await expect(
          this.token.getFunction('transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.holder,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        )
          .to.emit(this.token, 'AuthorizationUsed')
          .withArgs(this.holder.address, this.nonce)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.holder.address, this.recipient.address, value);

        await expect(this.token.balanceOf(this.holder)).to.eventually.equal(initialSupply - value);
        await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(value);
        await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
      });

      it('accepts ERC1271 wallet signature', async function () {
        const signature = await getDomain(this.token).then(domain =>
          this.holder.signTypedData(
            domain,
            { TransferWithAuthorization },
            {
              from: this.wallet.target,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        );

        await expect(
          this.token.getFunction('transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.wallet,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        )
          .to.emit(this.token, 'AuthorizationUsed')
          .withArgs(this.wallet.target, this.nonce)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.wallet.target, this.recipient.address, value);

        await expect(this.token.balanceOf(this.wallet)).to.eventually.equal(initialSupply - value);
        await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(value);
        await expect(this.token.authorizationState(this.wallet, this.nonce)).to.eventually.be.true;
      });

      it('rejects invalid ERC1271 signature', async function () {
        const signature = await getDomain(this.token).then(domain =>
          this.other.signTypedData(
            domain,
            { TransferWithAuthorization },
            {
              from: this.wallet.target,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        );

        await expect(
          this.token.getFunction('transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.wallet,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
      });
    });
  });

  describe('receiveWithAuthorization', function () {
    const value = 42n;

    beforeEach(async function () {
      this.nonce = ethers.hexlify(ethers.randomBytes(32));
      this.validAfter = 0n;
      this.validBefore = ethers.MaxUint256;

      this.buildData = (contract, from, to, validBefore = this.validBefore, nonce = this.nonce) =>
        getDomain(contract).then(domain => ({
          domain,
          types: { ReceiveWithAuthorization },
          message: {
            from: from.address,
            to: to.address,
            value,
            validAfter: this.validAfter,
            validBefore,
            nonce,
          },
        }));
    });

    it('accepts holder signature when called by recipient', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

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
        .to.emit(this.token, 'AuthorizationUsed')
        .withArgs(this.holder.address, this.nonce)
        .to.emit(this.token, 'Transfer')
        .withArgs(this.holder.address, this.recipient.address, value);

      await expect(this.token.balanceOf(this.holder)).to.eventually.equal(initialSupply - value);
      await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(value);
      await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
    });

    it('rejects when caller is not the recipient', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await expect(
        this.token
          .connect(this.other)
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
        .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
        .withArgs(this.recipient.address);
    });

    it('rejects reused signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
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
        .to.be.revertedWithCustomError(this.token, 'ERC3009ConsumedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });

    it('rejects other signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient)
        .then(({ domain, types, message }) => this.other.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

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
      ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
    });

    it('rejects authorization not yet valid', async function () {
      const validAfter = (await time.clock.timestamp()) + time.duration.weeks(1);

      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { ReceiveWithAuthorization },
            {
              from: this.holder.address,
              to: this.recipient.address,
              value,
              validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        )
        .then(ethers.Signature.from);

      await expect(
        this.token
          .connect(this.recipient)
          .receiveWithAuthorization(
            this.holder,
            this.recipient,
            value,
            validAfter,
            this.validBefore,
            this.nonce,
            v,
            r,
            s,
          ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009InvalidAuthorizationTime')
        .withArgs(validAfter, this.validBefore);
    });

    it('rejects expired authorization', async function () {
      const validBefore = (await time.clock.timestamp()) - time.duration.weeks(1);

      const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient, validBefore)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await expect(
        this.token
          .connect(this.recipient)
          .receiveWithAuthorization(
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

    describe('with bytes signature', function () {
      it('accepts holder signature when called by recipient', async function () {
        const signature = await this.buildData(this.token, this.holder, this.recipient).then(
          ({ domain, types, message }) => this.holder.signTypedData(domain, types, message),
        );

        await expect(
          this.token
            .connect(this.recipient)
            .getFunction('receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.holder,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        )
          .to.emit(this.token, 'AuthorizationUsed')
          .withArgs(this.holder.address, this.nonce)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.holder.address, this.recipient.address, value);

        await expect(this.token.balanceOf(this.holder)).to.eventually.equal(initialSupply - value);
        await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(value);
        await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
      });

      it('accepts ERC1271 wallet signature when called by recipient', async function () {
        const signature = await getDomain(this.token).then(domain =>
          this.holder.signTypedData(
            domain,
            { ReceiveWithAuthorization },
            {
              from: this.wallet.target,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        );

        await expect(
          this.token
            .connect(this.recipient)
            .getFunction('receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.wallet,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        )
          .to.emit(this.token, 'AuthorizationUsed')
          .withArgs(this.wallet.target, this.nonce)
          .to.emit(this.token, 'Transfer')
          .withArgs(this.wallet.target, this.recipient.address, value);

        await expect(this.token.balanceOf(this.wallet)).to.eventually.equal(initialSupply - value);
        await expect(this.token.balanceOf(this.recipient)).to.eventually.equal(value);
        await expect(this.token.authorizationState(this.wallet, this.nonce)).to.eventually.be.true;
      });

      it('rejects when caller is not the recipient', async function () {
        const signature = await this.buildData(this.token, this.holder, this.recipient).then(
          ({ domain, types, message }) => this.holder.signTypedData(domain, types, message),
        );

        await expect(
          this.token
            .connect(this.other)
            .getFunction('receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.holder,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        )
          .to.be.revertedWithCustomError(this.token, 'ERC20InvalidReceiver')
          .withArgs(this.recipient.address);
      });

      it('rejects invalid ERC1271 signature', async function () {
        const signature = await getDomain(this.token).then(domain =>
          this.other.signTypedData(
            domain,
            { ReceiveWithAuthorization },
            {
              from: this.wallet.target,
              to: this.recipient.address,
              value,
              validAfter: this.validAfter,
              validBefore: this.validBefore,
              nonce: this.nonce,
            },
          ),
        );

        await expect(
          this.token
            .connect(this.recipient)
            .getFunction('receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)')(
            this.wallet,
            this.recipient,
            value,
            this.validAfter,
            this.validBefore,
            this.nonce,
            signature,
          ),
        ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
      });
    });
  });

  describe('cancelAuthorization', function () {
    beforeEach(async function () {
      this.nonce = ethers.hexlify(ethers.randomBytes(32));

      this.buildData = (contract, authorizer, nonce = this.nonce) =>
        getDomain(contract).then(domain => ({
          domain,
          types: { CancelAuthorization },
          message: {
            authorizer: authorizer.address,
            nonce,
          },
        }));
    });

    it('accepts authorizer signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await expect(this.token.cancelAuthorization(this.holder, this.nonce, v, r, s))
        .to.emit(this.token, 'AuthorizationCanceled')
        .withArgs(this.holder.address, this.nonce);

      await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
    });

    it('rejects reused nonce', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await this.token.cancelAuthorization(this.holder, this.nonce, v, r, s);

      await expect(this.token.cancelAuthorization(this.holder, this.nonce, v, r, s))
        .to.be.revertedWithCustomError(this.token, 'ERC3009ConsumedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });

    it('rejects other signature', async function () {
      const { v, r, s } = await this.buildData(this.token, this.holder)
        .then(({ domain, types, message }) => this.other.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await expect(this.token.cancelAuthorization(this.holder, this.nonce, v, r, s)).to.be.revertedWithCustomError(
        this.token,
        'ERC3009InvalidSignature',
      );
    });

    it('prevents usage of canceled authorization in transferWithAuthorization', async function () {
      const value = 42n;
      const validAfter = 0n;
      const validBefore = ethers.MaxUint256;

      // Cancel the authorization
      const {
        v: vCancel,
        r: rCancel,
        s: sCancel,
      } = await this.buildData(this.token, this.holder)
        .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await this.token.cancelAuthorization(this.holder, this.nonce, vCancel, rCancel, sCancel);

      // Try to use the same nonce for transfer
      const { v, r, s } = await getDomain(this.token)
        .then(domain =>
          this.holder.signTypedData(
            domain,
            { TransferWithAuthorization },
            {
              from: this.holder.address,
              to: this.recipient.address,
              value,
              validAfter,
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
          validAfter,
          validBefore,
          this.nonce,
          v,
          r,
          s,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009ConsumedAuthorization')
        .withArgs(this.holder.address, this.nonce);
    });

    describe('with bytes signature', function () {
      it('accepts authorizer signature', async function () {
        const signature = await this.buildData(this.token, this.holder).then(({ domain, types, message }) =>
          this.holder.signTypedData(domain, types, message),
        );

        await expect(
          this.token.getFunction('cancelAuthorization(address,bytes32,bytes)')(this.holder, this.nonce, signature),
        )
          .to.emit(this.token, 'AuthorizationCanceled')
          .withArgs(this.holder.address, this.nonce);

        await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
      });

      it('accepts ERC1271 wallet signature', async function () {
        const signature = await getDomain(this.token).then(domain =>
          this.holder.signTypedData(
            domain,
            { CancelAuthorization },
            {
              authorizer: this.wallet.target,
              nonce: this.nonce,
            },
          ),
        );

        await expect(
          this.token.getFunction('cancelAuthorization(address,bytes32,bytes)')(this.wallet, this.nonce, signature),
        )
          .to.emit(this.token, 'AuthorizationCanceled')
          .withArgs(this.wallet.target, this.nonce);

        await expect(this.token.authorizationState(this.wallet, this.nonce)).to.eventually.be.true;
      });

      it('rejects invalid ERC1271 signature', async function () {
        const signature = await getDomain(this.token).then(domain =>
          this.other.signTypedData(
            domain,
            { CancelAuthorization },
            {
              authorizer: this.wallet.target,
              nonce: this.nonce,
            },
          ),
        );

        await expect(
          this.token.getFunction('cancelAuthorization(address,bytes32,bytes)')(this.wallet, this.nonce, signature),
        ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
      });
    });
  });
});
