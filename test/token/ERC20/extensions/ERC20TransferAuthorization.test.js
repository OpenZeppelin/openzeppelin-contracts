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

const packNonce = (key, seq = 0n) => ethers.toBeHex((BigInt(key) << 64n) | BigInt(seq), 32);
const withFlag = (value, mode) => value + (mode === 'timestamp' ? 0n : 0x800000000000n);

describe('ERC20TransferAuthorization', function () {
  for (const mode of ['timestamp', 'blockNumber']) {
    const fixture = async () => {
      const [holder, recipient, other] = await ethers.getSigners();

      const token = await ethers.deployContract('$ERC20TransferAuthorization', [name, symbol, name, version]);
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
    };

    describe(`with ${mode}`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      describe('authorizationState', function () {
        it('returns false for unused nonce', async function () {
          const nonce = packNonce(ethers.toBigInt(ethers.randomBytes(24)), 0n);
          await expect(this.token.authorizationState(this.holder, nonce)).to.eventually.be.false;
        });
      });

      describe('transferWithAuthorization', function () {
        const value = 42n;

        beforeEach(async function () {
          this.key = ethers.toBigInt(ethers.randomBytes(24));
          this.nonce = packNonce(this.key, 0n);
          this.validAfter = withFlag(0n, mode);
          this.validBefore = withFlag(0x7fffffffffffn, mode);

          this.buildData = (
            contract,
            from,
            to,
            { validAfter = this.validAfter, validBefore = this.validBefore, nonce = this.nonce } = {},
          ) =>
            getDomain(contract).then(domain => ({
              domain,
              types: { TransferWithAuthorization },
              message: {
                from: from.address,
                to: to.address,
                value,
                validAfter,
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
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, packNonce(this.key, 1n));
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
          const validAfter = withFlag((await time.clock[mode]()) + 10n, mode); // in the future

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
          const validBefore = withFlag((await time.clock[mode]()) - 5n, mode); // in the past

          const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient, { validBefore })
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

        it('treats mixed clock-flag inputs as timestamp', async function () {
          // validAfter has the block flag, validBefore does not. Per the AND-of-flags rule the contract
          // falls back to the timestamp clock. validBefore = blockNumber + 10 is then a tiny number compared
          // to block.timestamp, so the authorization is considered expired.
          const validAfter = withFlag(0n, 'blockNumber');
          const validBefore = withFlag((await time.clock.blockNumber()) + 10n, 'timestamp');

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
            .to.be.revertedWithCustomError(this.token, 'ERC3009InvalidAuthorizationTime')
            .withArgs(validAfter, validBefore);
        });

        it('rejects out-of-order nonces sharing the same key', async function () {
          const nonce0 = packNonce(this.key, 0n);
          const nonce1 = packNonce(this.key, 1n);

          const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient, { nonce: nonce1 })
            .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
            .then(ethers.Signature.from);

          await expect(
            this.token.transferWithAuthorization(
              this.holder,
              this.recipient,
              value,
              this.validAfter,
              this.validBefore,
              nonce1,
              v,
              r,
              s,
            ),
          )
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, nonce0);
        });

        it('works with different keys in parallel', async function () {
          const key1 = ethers.toBigInt(ethers.randomBytes(24));
          const key2 = ethers.toBigInt(ethers.randomBytes(24));
          const nonce1 = packNonce(key1, 0n);
          const nonce2 = packNonce(key2, 0n);

          const {
            v: v1,
            r: r1,
            s: s1,
          } = await this.buildData(this.token, this.holder, this.recipient, { nonce: nonce1 })
            .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
            .then(ethers.Signature.from);

          const {
            v: v2,
            r: r2,
            s: s2,
          } = await this.buildData(this.token, this.holder, this.recipient, { nonce: nonce2 })
            .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
            .then(ethers.Signature.from);

          // Submit in any order to show that different keys are independent
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
              this.token.getFunction(
                'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)',
              )(this.holder, this.recipient, value, this.validAfter, this.validBefore, this.nonce, signature),
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
              this.token.getFunction(
                'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)',
              )(this.wallet, this.recipient, value, this.validAfter, this.validBefore, this.nonce, signature),
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
              this.token.getFunction(
                'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)',
              )(this.wallet, this.recipient, value, this.validAfter, this.validBefore, this.nonce, signature),
            ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
          });

          it('rejects malformed signature', async function () {
            // 32 bytes instead of 65; SignatureChecker rejects without reverting in ECDSA.
            const signature = ethers.hexlify(ethers.randomBytes(32));

            await expect(
              this.token.getFunction(
                'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)',
              )(this.holder, this.recipient, value, this.validAfter, this.validBefore, this.nonce, signature),
            ).to.be.revertedWithCustomError(this.token, 'ERC3009InvalidSignature');
          });
        });
      });

      describe('receiveWithAuthorization', function () {
        const value = 42n;

        beforeEach(async function () {
          this.key = ethers.toBigInt(ethers.randomBytes(24));
          this.nonce = packNonce(this.key, 0n);
          this.validAfter = withFlag(0n, mode);
          this.validBefore = withFlag(0x7fffffffffffn, mode);

          this.buildData = (
            contract,
            from,
            to,
            { validAfter = this.validAfter, validBefore = this.validBefore, nonce = this.nonce } = {},
          ) =>
            getDomain(contract).then(domain => ({
              domain,
              types: { ReceiveWithAuthorization },
              message: {
                from: from.address,
                to: to.address,
                value,
                validAfter,
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
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, packNonce(this.key, 1n));
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
          const validAfter = withFlag((await time.clock[mode]()) + 10n, mode); // in the future

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
          const validBefore = withFlag((await time.clock[mode]()) - 5n, mode); // in the past

          const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient, { validBefore })
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

        it('rejects out-of-order nonces sharing the same key', async function () {
          const nonce0 = packNonce(this.key, 0n);
          const nonce1 = packNonce(this.key, 1n);

          const { v, r, s } = await this.buildData(this.token, this.holder, this.recipient, { nonce: nonce1 })
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
                nonce1,
                v,
                r,
                s,
              ),
          )
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, nonce0);
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
          this.key = ethers.toBigInt(ethers.randomBytes(24));
          this.nonce = packNonce(this.key, 0n);

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
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, packNonce(this.key, 1n));
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
          const validAfter = withFlag(0n, mode);
          const validBefore = withFlag(0x7fffffffffffn, mode);

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
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, packNonce(this.key, 1n));
        });

        it('rejects cancellation of a non-next nonce in the same key sequence', async function () {
          // Authorizer signs a cancel for sequence 5 while the next-to-use is sequence 0.
          // The keyed-nonce model only consumes the next nonce, so this must revert.
          const nonce5 = packNonce(this.key, 5n);

          const { v, r, s } = await this.buildData(this.token, this.holder, nonce5)
            .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
            .then(ethers.Signature.from);

          await expect(this.token.cancelAuthorization(this.holder, nonce5, v, r, s))
            .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
            .withArgs(this.holder.address, packNonce(this.key, 0n));
        });

        it('cancels the next nonce after consuming the previous one', async function () {
          const value = 42n;
          const validAfter = withFlag(0n, mode);
          const validBefore = withFlag(0x7fffffffffffn, mode);
          const nonce0 = packNonce(this.key, 0n);
          const nonce1 = packNonce(this.key, 1n);
          const nonce2 = packNonce(this.key, 2n);

          // Consume sequence 0 via transfer.
          const transferSig = await getDomain(this.token)
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
                  nonce: nonce0,
                },
              ),
            )
            .then(ethers.Signature.from);

          await this.token.transferWithAuthorization(
            this.holder,
            this.recipient,
            value,
            validAfter,
            validBefore,
            nonce0,
            transferSig.v,
            transferSig.r,
            transferSig.s,
          );

          // Cancel sequence 1.
          const cancelSig = await this.buildData(this.token, this.holder, nonce1)
            .then(({ domain, types, message }) => this.holder.signTypedData(domain, types, message))
            .then(ethers.Signature.from);

          await expect(this.token.cancelAuthorization(this.holder, nonce1, cancelSig.v, cancelSig.r, cancelSig.s))
            .to.emit(this.token, 'AuthorizationCanceled')
            .withArgs(this.holder.address, nonce1);

          // Sequence 0 (consumed) and 1 (cancelled) both report `true`; sequence 2 is the new next-to-use.
          await expect(this.token.authorizationState(this.holder, nonce0)).to.eventually.be.true;
          await expect(this.token.authorizationState(this.holder, nonce1)).to.eventually.be.true;
          await expect(this.token.authorizationState(this.holder, nonce2)).to.eventually.be.false;
        });

        it('shares the keyed counter between transfer and receive', async function () {
          const value = 42n;
          const validAfter = withFlag(0n, mode);
          const validBefore = withFlag(0x7fffffffffffn, mode);
          const nonce0 = packNonce(this.key, 0n);
          const nonce1 = packNonce(this.key, 1n);

          // Consume sequence 0 via transfer.
          const transferSig = await getDomain(this.token)
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
                  nonce: nonce0,
                },
              ),
            )
            .then(ethers.Signature.from);

          await this.token.transferWithAuthorization(
            this.holder,
            this.recipient,
            value,
            validAfter,
            validBefore,
            nonce0,
            transferSig.v,
            transferSig.r,
            transferSig.s,
          );

          // A receive authorization on the same key must use sequence 1; sequence 0 is consumed.
          const receiveSig = await getDomain(this.token)
            .then(domain =>
              this.holder.signTypedData(
                domain,
                { ReceiveWithAuthorization },
                {
                  from: this.holder.address,
                  to: this.recipient.address,
                  value,
                  validAfter,
                  validBefore,
                  nonce: nonce1,
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
              validAfter,
              validBefore,
              nonce1,
              receiveSig.v,
              receiveSig.r,
              receiveSig.s,
            );

          await expect(this.token.authorizationState(this.holder, nonce0)).to.eventually.be.true;
          await expect(this.token.authorizationState(this.holder, nonce1)).to.eventually.be.true;
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

          it('prevents usage of canceled authorization by an ERC1271 wallet', async function () {
            const value = 42n;
            const validAfter = withFlag(0n, mode);
            const validBefore = withFlag(0x7fffffffffffn, mode);

            // Wallet cancels sequence 0.
            const cancelSignature = await getDomain(this.token).then(domain =>
              this.holder.signTypedData(
                domain,
                { CancelAuthorization },
                { authorizer: this.wallet.target, nonce: this.nonce },
              ),
            );

            await this.token.getFunction('cancelAuthorization(address,bytes32,bytes)')(
              this.wallet,
              this.nonce,
              cancelSignature,
            );

            // A transfer signed for the same nonce now reverts: counter advanced past sequence 0.
            const transferSignature = await getDomain(this.token).then(domain =>
              this.holder.signTypedData(
                domain,
                { TransferWithAuthorization },
                {
                  from: this.wallet.target,
                  to: this.recipient.address,
                  value,
                  validAfter,
                  validBefore,
                  nonce: this.nonce,
                },
              ),
            );

            await expect(
              this.token.getFunction(
                'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,bytes)',
              )(this.wallet, this.recipient, value, validAfter, validBefore, this.nonce, transferSignature),
            )
              .to.be.revertedWithCustomError(this.token, 'InvalidAccountNonce')
              .withArgs(this.wallet.target, packNonce(this.key, 1n));
          });
        });
      });
    });
  }
});
