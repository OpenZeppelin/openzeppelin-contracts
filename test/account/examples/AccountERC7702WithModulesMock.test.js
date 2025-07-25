const { ethers, predeploy } = require('hardhat');
const { loadFixture, setBalance } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain } = require('../../helpers/eip712');
const { ERC4337Helper } = require('../../helpers/erc4337');
const { PackedUserOperation } = require('../../helpers/eip712-types');

const { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } = require('../Account.behavior');
const { shouldBehaveLikeAccountERC7579 } = require('../extensions/AccountERC7579.behavior');
const { shouldBehaveLikeERC1271 } = require('../../utils/cryptography/ERC1271.behavior');
const { shouldBehaveLikeERC7821 } = require('../extensions/ERC7821.behavior');

const { MODULE_TYPE_VALIDATOR } = require('../../helpers/erc7579');

async function fixture() {
  // EOAs and environment
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const anotherTarget = await ethers.deployContract('CallReceiverMock');

  // Signer with EIP-7702 support + funding
  const eoa = ethers.Wallet.createRandom(ethers.provider);
  await setBalance(eoa.address, ethers.WeiPerEther);

  // ERC-7579 validator module
  const validator = await ethers.deployContract('$ERC7579ValidatorMock');

  // ERC-4337 account
  const helper = new ERC4337Helper();
  const mock = await helper.newAccount('$AccountERC7702WithModulesMock', ['AccountERC7702WithModulesMock', '1'], {
    erc7702signer: eoa,
  });

  // ERC-4337 Entrypoint domain
  const entrypointDomain = await getDomain(predeploy.entrypoint.v08);

  // domain cannot be fetched using getDomain(mock) before the mock is deployed
  const domain = {
    name: 'AccountERC7702WithModulesMock',
    version: '1',
    chainId: entrypointDomain.chainId,
    verifyingContract: mock.address,
  };

  return { helper, validator, mock, domain, entrypointDomain, eoa, target, anotherTarget, beneficiary, other };
}

describe('AccountERC7702WithModules: ERC-7702 account with ERC-7579 modules supports', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('using ERC-7702 signer', function () {
    beforeEach(async function () {
      this.signer = this.eoa;
      this.signUserOp = userOp =>
        this.signer
          .signTypedData(this.entrypointDomain, { PackedUserOperation }, userOp.packed)
          .then(signature => Object.assign(userOp, { signature }));
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeERC7821({ deployable: false });
    shouldBehaveLikeERC1271({ erc7739: true });
  });

  describe('using ERC-7579 validator', function () {
    beforeEach(async function () {
      // signer that adds a prefix to all signatures (except the userOp ones)
      this.signer = ethers.Wallet.createRandom();
      this.signer.signMessage = message =>
        ethers.Wallet.prototype.signMessage
          .bind(this.signer)(message)
          .then(sign => ethers.concat([this.validator.target, sign]));
      this.signer.signTypedData = (domain, types, values) =>
        ethers.Wallet.prototype.signTypedData
          .bind(this.signer)(domain, types, values)
          .then(sign => ethers.concat([this.validator.target, sign]));

      this.signUserOp = userOp =>
        ethers.Wallet.prototype.signTypedData
          .bind(this.signer)(this.entrypointDomain, { PackedUserOperation }, userOp.packed)
          .then(signature => Object.assign(userOp, { signature }));

      // Use the first 20 bytes from the nonce key (24 bytes) to identify the validator module
      this.userOp = { nonce: ethers.zeroPadBytes(ethers.hexlify(this.validator.target), 32) };

      // Deploy (using ERC-7702) and add the validator module using EOA
      await this.mock.deploy();
      await this.mock.connect(this.eoa).installModule(MODULE_TYPE_VALIDATOR, this.validator, this.signer.address);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeAccountERC7579();
    shouldBehaveLikeERC1271({ erc7739: false });
  });
});
