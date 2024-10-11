const { ethers } = require('hardhat');
const {
  shouldBehaveLikeAnAccountBase,
  shouldBehaveLikeAnAccountBaseExecutor,
  shouldBehaveLikeAccountHolder,
} = require('./Account.behavior');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper } = require('../helpers/erc4337');
const { RSASigner } = require('../helpers/signers');
const { shouldBehaveLikeERC7739Signer } = require('../utils/cryptography/ERC7739Signer.behavior');

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
  shouldBehaveLikeAccountHolder();

  describe('ERC7739Signer', function () {
    beforeEach(async function () {
      this.mock = await this.smartAccount.deploy();
    });

    shouldBehaveLikeERC7739Signer();
  });
});
