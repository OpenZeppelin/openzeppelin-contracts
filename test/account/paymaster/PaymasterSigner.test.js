import { network } from 'hardhat';
import { expect } from 'chai';
import { getDomain } from '../../helpers/eip712';
import { PackedUserOperation, UserOperationRequest } from '../../helpers/eip712-types';
import { ERC4337Helper } from '../../helpers/erc4337';
import { shouldBehaveLikePaymaster } from './Paymaster.behavior';

const BLOCK_RANGE_FLAG = 0x800000000000n;

const connection = await network.create();
const {
  ethers,
  helpers: { time },
  networkHelpers: { loadFixture },
} = connection;

for (const [name, opts] of Object.entries({
  PaymasterSigner: { postOp: true, timeRange: true },
  PaymasterSignerContextNoPostOp: { postOp: false, timeRange: true },
})) {
  async function fixture() {
    // EOAs and environment
    const [admin, receiver, other] = await ethers.getSigners();
    const target = await ethers.deployContract('CallReceiverMock');

    // signers
    const accountSigner = ethers.Wallet.createRandom();
    const paymasterSigner = ethers.Wallet.createRandom();

    // ERC-4337 account
    const helper = new ERC4337Helper(connection);
    const account = await helper.newAccount('$AccountECDSAMock', [accountSigner, 'AccountECDSA', '1']);
    await account.deploy();

    // ERC-4337 paymaster
    const paymaster = await ethers.deployContract(`$${name}Mock`, [
      'MyPaymasterECDSASigner',
      '1',
      paymasterSigner,
      admin,
    ]);

    // Domains
    const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);
    const paymasterDomain = await getDomain(paymaster);

    const signUserOp = userOp =>
      accountSigner
        .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
        .then(signature => Object.assign(userOp, { signature }));

    const paymasterSignUserOp =
      signer =>
      (userOp, { validAfter = 0n, validUntil = 0n } = {}) =>
        signer
          .signTypedData(
            paymasterDomain,
            { UserOperationRequest },
            {
              ...userOp.packed,
              paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit,
              paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit,
              validAfter,
              validUntil,
            },
          )
          .then(signature =>
            Object.assign(userOp, {
              paymasterData: ethers.solidityPacked(['uint48', 'uint48', 'bytes'], [validAfter, validUntil, signature]),
            }),
          );

    return {
      helper,
      admin,
      receiver,
      other,
      target,
      account,
      paymaster,
      signUserOp,
      paymasterSignUserOp: paymasterSignUserOp(paymasterSigner), // sign using the correct key
      paymasterSignUserOpInvalid: paymasterSignUserOp(other), // sign using the wrong key
    };
  }

  describe(name, function () {
    beforeEach(async function () {
      Object.assign(this, connection, await loadFixture(fixture));
    });

    describe('with deposit', function () {
      beforeEach(async function () {
        await this.paymaster.deposit({ value: ethers.parseEther('1') });
      });

      for (const { name, flag, reason } of [
        { name: 'timestamp', flag: 0n, reason: 'AA32 paymaster expired or not due' },
        { name: 'blockNumber', flag: BLOCK_RANGE_FLAG, reason: 'AA37 paymaster inval block range' },
      ]) {
        describe(`${name}-range sponsorship`, function () {
          it(`accepts a valid ${name}-range sponsorship`, async function () {
            const now = await time.clock[name]();
            const signedUserOp = await this.account
              .createUserOp({
                paymaster: this.paymaster,
              })
              .then(op => this.paymasterSignUserOp(op, { validAfter: flag | 0n, validUntil: flag | (now + 100n) }))
              .then(op => this.signUserOp(op));

            await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver)).to.not.revert(
              ethers,
            );
          });

          it(`rejects expired ${name}-range sponsorships (validUntil in the past)`, async function () {
            const now = await time.clock[name]();
            const signedUserOp = await this.account
              .createUserOp({
                paymaster: this.paymaster,
              })
              .then(op => this.paymasterSignUserOp(op, { validAfter: flag | 1n, validUntil: flag | (now - 1n) }))
              .then(op => this.signUserOp(op));

            await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
              .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
              .withArgs(0n, reason);
          });

          it(`accepts a ${name}-range sponsorship with validUntil = 0 (no expiry)`, async function () {
            const signedUserOp = await this.account
              .createUserOp({ paymaster: this.paymaster })
              .then(op => this.paymasterSignUserOp(op, { validAfter: flag | 1n, validUntil: 0n }))
              .then(op => this.signUserOp(op));

            await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver)).to.not.revert(
              ethers,
            );
          });

          if (flag !== 0n) {
            it(`rejects a ${name}-range sponsorship with validUntil = BLOCK_RANGE_FLAG (expired at genesis)`, async function () {
              const signedUserOp = await this.account
                .createUserOp({ paymaster: this.paymaster })
                .then(op => this.paymasterSignUserOp(op, { validAfter: flag | 1n, validUntil: flag | 0n }))
                .then(op => this.signUserOp(op));

              await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
                .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
                .withArgs(0n, reason);
            });
          }
        });
      }

      it('rejects when range uses mixed values', async function () {
        const signedUserOp1 = await this.account
          .createUserOp({ paymaster: this.paymaster })
          .then(op => this.paymasterSignUserOp(op, { validAfter: BLOCK_RANGE_FLAG, validUntil: BLOCK_RANGE_FLAG - 1n }))
          .then(op => this.signUserOp(op));

        await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp1.packed], this.receiver))
          .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
          .withArgs(0n, 'AA34 signature error');

        const signedUserOp2 = await this.account
          .createUserOp({ paymaster: this.paymaster })
          .then(op => this.paymasterSignUserOp(op, { validAfter: BLOCK_RANGE_FLAG - 1n, validUntil: BLOCK_RANGE_FLAG }))
          .then(op => this.signUserOp(op));

        await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp2.packed], this.receiver))
          .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
          .withArgs(0n, 'AA34 signature error');
      });

      it('returns SIG_VALIDATION_FAILED for paymasterData shorter than 12 bytes', async function () {
        const signedUserOp = await this.account
          .createUserOp({ paymaster: this.paymaster })
          .then(op => {
            op.paymasterData = '0x'; // empty (0 bytes < 12)
            return op;
          })
          .then(op => this.signUserOp(op));

        await expect(ethers.predeploy.entrypoint.v09.handleOps([signedUserOp.packed], this.receiver))
          .to.be.revertedWithCustomError(ethers.predeploy.entrypoint.v09, 'FailedOp')
          .withArgs(0n, 'AA34 signature error');
      });
    });

    shouldBehaveLikePaymaster(opts);
  });
}
