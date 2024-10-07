const { ethers } = require('hardhat');
const { shouldBehaveLikeAnAccountBase, shouldBehaveLikeAnAccountBaseExecutor } = require('./Account.behavior');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper } = require('../helpers/erc4337');

class BooleanSigner {
  signPersonal() {
    return '0x01';
  }
}

async function fixture() {
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const signer = new BooleanSigner();
  const helper = new ERC4337Helper('$AccountBaseMock');
  const smartAccount = await helper.newAccount();

  return { ...helper, smartAccount, signer, target, beneficiary, other };
}

describe('AccountBase', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAnAccountBase();
  shouldBehaveLikeAnAccountBaseExecutor();
});
