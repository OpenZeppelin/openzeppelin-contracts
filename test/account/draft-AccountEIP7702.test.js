const { ethers } = require('hardhat');
const {
  shouldBehaveLikeAnAccountBase,
  shouldBehaveLikeAnAccountBaseExecutor,
  shouldBehaveLikeAccountHolder,
} = require('./Account.behavior');
const { loadFixture, setCode } = require('@nomicfoundation/hardhat-network-helpers');
const { ERC4337Helper, SmartAccount } = require('../helpers/erc4337');
const { ECDSASigner } = require('../helpers/signers');
const { shouldBehaveLikeERC7739Signer } = require('../utils/cryptography/ERC7739Signer.behavior');
const { domainSeparator } = require('../helpers/eip712');

async function fixture() {
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const signer = new ECDSASigner();
  const helper = new ERC4337Helper('$AccountEIP7702');
  await helper.wait();
  const domain = {
    name: 'AccountEIP7702',
    version: '1',
    chainId: helper.chainId,
    verifyingContract: signer.EOA.address,
  };

  const _account = await helper.accountContract.deploy('AccountEIP7702', '1');
  const EIP7702Code = await ethers.provider
    .getCode(_account.target)
    // Replace immutable address
    .then(code =>
      code.replaceAll(_account.target.toLowerCase().replace(/^0x/, ''), signer.EOA.address.replace(/^0x/, '')),
    )
    // Replace EIP-712 domain separator
    .then(code =>
      code.replaceAll(
        domainSeparator({ ...domain, verifyingContract: _account.target }).replace(/^0x/, ''),
        domainSeparator(domain).replace(/^0x/, ''),
      ),
    );

  const smartAccount = new SmartAccount(
    helper.accountContract.attach(signer.EOA.address),
    '0x', // Not needed
    helper,
  );

  // Simulate the deploy function
  smartAccount.deploy = async () => {
    await setCode(smartAccount.target, EIP7702Code);
    return smartAccount;
  };

  return { ...helper, domain, smartAccount, signer, target, beneficiary, other };
}

describe('AccountEIP7702', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeAnAccountBase();
  shouldBehaveLikeAnAccountBaseExecutor({
    deployable: false,
  });
  shouldBehaveLikeAccountHolder();

  describe('ERC7739Signer', function () {
    beforeEach(async function () {
      this.mock = await this.smartAccount.deploy();
    });

    shouldBehaveLikeERC7739Signer();
  });
});
