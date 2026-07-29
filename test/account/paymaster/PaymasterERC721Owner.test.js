const { ethers, predeploy } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain, PackedUserOperation } = require('../../helpers/eip712');
const { ERC4337Helper } = require('../../helpers/erc4337');

const { shouldBehaveLikePaymaster } = require('./Paymaster.behavior');

for (const [name, opts] of Object.entries({
  PaymasterERC721Owner: { postOp: true, timeRange: false },
  PaymasterERC721OwnerContextNoPostOp: { postOp: false, timeRange: false },
})) {
  async function fixture() {
    // EOAs and environment
    const [admin, receiver, other] = await ethers.getSigners();
    const target = await ethers.deployContract('CallReceiverMock');
    const token = await ethers.deployContract('$ERC721Enumerable', ['Some NFT', 'SNFT']);

    // signers
    const accountSigner = ethers.Wallet.createRandom();

    // ERC-4337 account
    const helper = new ERC4337Helper();
    const account = await helper.newAccount('$AccountECDSAMock', [accountSigner, 'AccountECDSA', '1']);
    await account.deploy();

    // ERC-4337 paymaster
    const paymaster = await ethers.deployContract(`$${name}Mock`, [token, admin]);

    // Domains
    const entrypointDomain = await getDomain(predeploy.entrypoint.v09);

    const signUserOp = userOp =>
      accountSigner
        .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
        .then(signature => Object.assign(userOp, { signature }));

    const paymasterSignUserOp = userOp =>
      token
        .totalSupply()
        .then(i => token.$_mint(userOp.sender, i))
        .then(() => userOp);

    return {
      admin,
      receiver,
      other,
      target,
      account,
      paymaster,
      signUserOp,
      paymasterSignUserOp, // mint a token for the userOp sender
      paymasterSignUserOpInvalid: userOp => userOp, // don't do anything
    };
  }

  describe(name, function () {
    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikePaymaster(opts);
  });
}
