import { network } from 'hardhat';
import { getDomain } from '../../helpers/eip712';
import { ERC4337Helper } from '../../helpers/erc4337';
import { PackedUserOperation } from '../../helpers/eip712-types';
import { shouldBehaveLikeAccountCore } from '../Account.behavior';
import { shouldBehaveLikeAccountERC7579 } from './AccountERC7579.behavior';
import { shouldBehaveLikeERC1271 } from '../../utils/cryptography/ERC1271.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

async function fixture() {
  // EOAs and environment
  const [other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const anotherTarget = await ethers.deployContract('CallReceiverMock');

  // ERC-7579 validator
  const validator = await ethers.deployContract('$ERC7579ValidatorMock');

  // ERC-4337 signer
  const signer = ethers.Wallet.createRandom();

  // ERC-4337 account
  const helper = new ERC4337Helper(connection);
  const mock = await helper.newAccount('$AccountERC7579HookedMock', [
    validator,
    ethers.solidityPacked(['address'], [signer.address]),
  ]);

  // ERC-4337 Entrypoint domain
  const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);

  return { helper, validator, mock, entrypointDomain, signer, target, anotherTarget, other };
}

describe('AccountERC7579Hooked', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));

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

    this.userOp = { nonce: ethers.zeroPadBytes(ethers.hexlify(this.validator.target), 32) };
  });

  shouldBehaveLikeAccountCore();
  shouldBehaveLikeAccountERC7579({ withHooks: true });
  shouldBehaveLikeERC1271();
});
