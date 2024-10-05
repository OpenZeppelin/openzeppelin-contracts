const { ethers } = require('hardhat');
const { shouldBehaveLikeAnAccount } = require('./Account.behavior');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper } = require('../helpers/erc4337');

class BooleanSigner {
  signRaw() {
    return '0x01';
  }
}

async function fixture() {
  const [other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const helper = new ERC4337Helper('$AccountBaseMock');
  await helper.wait();
  const smartAccount = await helper.newAccount();
  const signer = new BooleanSigner();

  return { ...helper, smartAccount, signer, target, other };
}

describe('AccountBase', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAnAccount();
});
