import { network } from 'hardhat';
import { expect } from 'chai';
import {
  getDomain,
  TransferWithAuthorization,
  ReceiveWithAuthorization,
  CancelAuthorization,
} from '../../../helpers/eip712';
import * as random from '../../../helpers/random';

const {
  ethers,
  helpers: { time },
  networkHelpers: { loadFixture },
} = await network.create();

const name = 'My Token';
const symbol = 'MTKN';
const version = '1';
const initialSupply = 100n;

const withFlag = (value, mode) => value + (mode === 'timestamp' ? 0n : 0x800000000000n);

const fixture = async () => {
  const [holder, recipient, other] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC3009', [name, symbol, name, version]);
  await token.$_mint(holder, initialSupply);

  return { holder, recipient, other, token };
};

describe('ERC3009', function () {
  for (const mode of ['timestamp', 'blockNumber']) {
    describe(`using ${mode} clock`, function () {
      beforeEach(async function () {
        Object.assign(this, await loadFixture(fixture));
      });

      describe('authorizationState', function () {
        it('returns false for unused nonce', async function () {
          await expect(this.token.authorizationState(this.holder, random.bytes32())).to.eventually.be.false;
        });

        it('returns true after the nonce is consumed', async function () {
          const nonce = random.bytes32();
          const validAfter = withFlag(0n, mode);
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
          this.nonce = random.bytes32();
          this.validAfter = withFlag(0n, mode);
          this.validBefore = ethers.MaxUint256;
        });

        it('accepts random nonces in any order', async function () {
          const nonceA = random.bytes32();
          const nonceB = random.bytes32();

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

        it('rejects expired authorization', async function () {
          const validBefore = await time.clock[mode]().then(clock => withFlag(clock - 1n, mode));

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

        it('rejects validAfter that points to an value beyond the type(uint48).max', async function () {
          const validAfter = withFlag(1n << 64n, mode);
          const validBefore = ethers.MaxUint256;

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

        it('supports validBefore that points to an value beyond the type(uint48).max', async function () {
          const validAfter = withFlag(0n, mode);
          const validBefore = withFlag(1n << 64n, mode); // high bit = far in the future

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

          await this.token.transferWithAuthorization(
            this.holder,
            this.recipient,
            value,
            validAfter,
            validBefore,
            this.nonce,
            v,
            r,
            s,
          );

          await expect(this.token.authorizationState(this.holder, this.nonce)).to.eventually.be.true;
        });

        it('emits AuthorizationUsed and Transfer with the expected balance changes', async function () {
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
        });

        it('rejects invalid signature', async function () {
          const { v, r, s } = await getDomain(this.token)
            .then(domain =>
              this.other.signTypedData(
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
          const validAfter = await time.clock[mode]().then(clock => withFlag(clock + 100n, mode));

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

        it('rejects at the validAfter boundary (current == validAfter)', async function () {
          const target = (await time.clock[mode]()) + 5n;
          if (mode === 'blockNumber') {
            await time.increaseTo.blockNumber(target - 1n);
          } else {
            await time.increaseTo.timestamp(target, false);
          }
          const validAfter = withFlag(target, mode);

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

        it('rejects at the validBefore boundary (current == validBefore)', async function () {
          const target = (await time.clock[mode]()) + 5n;
          if (mode === 'blockNumber') {
            await time.increaseTo.blockNumber(target - 1n);
          } else {
            await time.increaseTo.timestamp(target, false);
          }
          const validBefore = withFlag(target, mode);

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
          this.nonce = random.bytes32();
          this.validAfter = withFlag(0n, mode);
          this.validBefore = ethers.MaxUint256;
        });

        it('accepts holder signature when called by recipient', async function () {
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

        it('rejects invalid signature', async function () {
          const { v, r, s } = await getDomain(this.token)
            .then(domain =>
              this.other.signTypedData(
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
          this.nonce = random.bytes32();
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

        it('rejects invalid signature', async function () {
          const { v, r, s } = await getDomain(this.token)
            .then(domain =>
              this.other.signTypedData(
                domain,
                { CancelAuthorization },
                { authorizer: this.holder.address, nonce: this.nonce },
              ),
            )
            .then(ethers.Signature.from);

          await expect(this.token.cancelAuthorization(this.holder, this.nonce, v, r, s)).to.be.revertedWithCustomError(
            this.token,
            'ERC3009InvalidSignature',
          );
        });
      });
    });
  }

  describe('mixed clock-flag inputs', function () {
    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    it('falls back to the timestamp clock', async function () {
      // validAfter has the block flag, validBefore does not. Per the AND-of-flags rule the
      // contract falls back to the timestamp clock. validBefore = (currentBlock + 10) is then a
      // tiny number compared to block.timestamp, so the authorization is considered expired.
      const nonce = random.bytes32();
      const value = 42n;
      const validAfter = withFlag(0n, 'blockNumber');
      const validBefore = await time.clock.blockNumber().then(clock => withFlag(clock + 10n, 'timestamp'));

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
              nonce,
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
          nonce,
          v,
          r,
          s,
        ),
      )
        .to.be.revertedWithCustomError(this.token, 'ERC3009InvalidAuthorizationTime')
        .withArgs(validAfter, validBefore);
    });
  });
});
