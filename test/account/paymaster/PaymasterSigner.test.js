const { ethers, predeploy } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, PackedUserOperation, UserOperationRequest } = require('../../helpers/eip712');
const { ERC4337Helper } = require('../../helpers/erc4337');

const { shouldBehaveLikePaymaster } = require('./Paymaster.behavior');

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
    const helper = new ERC4337Helper();
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
    const entrypointDomain = await getDomain(predeploy.entrypoint.v09);
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
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikePaymaster(opts);
  });
}
