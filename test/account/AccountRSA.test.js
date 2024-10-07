const { ethers } = require('hardhat');
const { shouldBehaveLikeAnAccountBase, shouldBehaveLikeAnAccountBaseExecutor } = require('./Account.behavior');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper } = require('../helpers/erc4337');
const { RSASigner } = require('../helpers/signers');
const { shouldBehaveLikeERC1271TypedSigner } = require('../utils/cryptography/ERC1271TypedSigner.behavior');

async function fixture() {
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const signer = new RSASigner();
  const helper = new ERC4337Helper('$AccountRSA');
  const smartAccount = await helper.newAccount(['AccountRSA', '1', signer.publicKey.e, signer.publicKey.n]);
  const domain = {
    name: 'AccountRSA',
    version: '1',
    chainId: helper.chainId,
    verifyingContract: smartAccount.address,
  };

  return { ...helper, domain, smartAccount, signer, target, beneficiary, other };
}

describe('AccountRSA', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAnAccountBase();
  shouldBehaveLikeAnAccountBaseExecutor();

  describe('ERC1271TypedSigner', function () {
    beforeEach(async function () {
      this.signer.mock = await this.smartAccount.deploy();
    });

    shouldBehaveLikeERC1271TypedSigner();
  });
});
