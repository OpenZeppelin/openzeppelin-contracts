const { ethers } = require('hardhat');
const { shouldBehaveLikeAnAccountBase, shouldBehaveLikeAnAccountBaseExecutor } = require('./Account.behavior');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper } = require('../helpers/erc4337');
const { ECDSASigner } = require('../helpers/signers');
const { shouldBehaveLikeERC1271TypedSigner } = require('../utils/cryptography/ERC1271TypedSigner.behavior');

async function fixture() {
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const signer = new ECDSASigner();
  const helper = new ERC4337Helper('$AccountECDSA');
  const smartAccount = await helper.newAccount(['AccountECDSA', '1', signer.EOA.address]);
  const domain = {
    name: 'AccountECDSA',
    version: '1',
    chainId: helper.chainId,
    verifyingContract: smartAccount.address,
  };

  return { ...helper, domain, smartAccount, signer, target, beneficiary, other };
}

describe('AccountECDSA', function () {
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
