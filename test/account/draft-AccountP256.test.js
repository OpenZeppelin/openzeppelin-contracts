const { ethers } = require('hardhat');
const {
  shouldBehaveLikeAnAccountBase,
  shouldBehaveLikeAnAccountBaseExecutor,
  shouldBehaveLikeAccountHolder,
} = require('./Account.behavior');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper } = require('../helpers/erc4337');
const { P256Signer } = require('../helpers/signers');
const { shouldBehaveLikeERC1271TypedSigner } = require('../utils/cryptography/ERC1271TypedSigner.behavior');

async function fixture() {
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const signer = new P256Signer();
  const helper = new ERC4337Helper('$AccountP256');
  const smartAccount = await helper.newAccount(['AccountP256', '1', signer.publicKey.qx, signer.publicKey.qy]);
  const domain = {
    name: 'AccountP256',
    version: '1',
    chainId: helper.chainId,
    verifyingContract: smartAccount.address,
  };

  return { ...helper, domain, smartAccount, signer, target, beneficiary, other };
}

describe('AccountP256', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAnAccountBase();
  shouldBehaveLikeAnAccountBaseExecutor();
  shouldBehaveLikeAccountHolder();

  describe('ERC1271TypedSigner', function () {
    beforeEach(async function () {
      this.mock = await this.smartAccount.deploy();
    });

    shouldBehaveLikeERC1271TypedSigner();
  });
});
