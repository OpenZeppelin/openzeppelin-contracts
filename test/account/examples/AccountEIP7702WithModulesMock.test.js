import { network } from 'hardhat';
import { getDomain } from '../../helpers/eip712';
import { ERC4337Helper } from '../../helpers/erc4337';
import { MODULE_TYPE_VALIDATOR } from '../../helpers/erc7579';
import { PackedUserOperation } from '../../helpers/eip712-types';
import { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } from '../Account.behavior';
import { shouldBehaveLikeAccountERC7579 } from '../extensions/AccountERC7579.behavior';
import { shouldBehaveLikeERC1271 } from '../../utils/cryptography/ERC1271.behavior';
import { shouldBehaveLikeERC7821 } from '../extensions/ERC7821.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture, setBalance },
} = connection;

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
  const helper = new ERC4337Helper(connection);
  const mock = await helper.newAccount('$AccountEIP7702WithModulesMock', ['AccountEIP7702WithModulesMock', '1'], {
    eip7702signer: eoa,
  });

  // ERC-4337 Entrypoint domain
  const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);

  // domain cannot be fetched using getDomain(mock) before the mock is deployed
  const domain = {
    name: 'AccountEIP7702WithModulesMock',
    version: '1',
    chainId: entrypointDomain.chainId,
    verifyingContract: mock.address,
  };

  return { helper, validator, mock, domain, entrypointDomain, eoa, target, anotherTarget, beneficiary, other };
}

describe('AccountEIP7702WithModules: EIP-7702 account with ERC-7579 modules supports', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));
  });

  describe('using EIP-7702 signer', function () {
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

      // Deploy (using EIP-7702) and add the validator module using EOA
      await this.mock.deploy();
      await this.mock.connect(this.eoa).installModule(MODULE_TYPE_VALIDATOR, this.validator, this.signer.address);
    });

    shouldBehaveLikeAccountCore();
    shouldBehaveLikeAccountHolder();
    shouldBehaveLikeAccountERC7579();
    shouldBehaveLikeERC1271({ erc7739: false });
  });
});
