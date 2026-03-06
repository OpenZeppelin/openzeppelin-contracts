import { network } from 'hardhat';
import { getDomain } from '../helpers/eip712';
import { ERC4337Helper } from '../helpers/erc4337';
import { PackedUserOperation } from '../helpers/eip712-types';
import { NonNativeSigner } from '../helpers/signers';
import { shouldBehaveLikeAccountCore, shouldBehaveLikeAccountHolder } from './Account.behavior';
import { shouldBehaveLikeERC1271 } from '../utils/cryptography/ERC1271.behavior';
import { shouldBehaveLikeERC7821 } from './extensions/ERC7821.behavior';

const connection = await network.connect();
const {
  ethers,
  networkHelpers: { loadFixture },
} = connection;

async function fixture() {
  // EOAs and environment
  const [beneficiary, other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');

  // ERC-4337 signer
  const signer = new NonNativeSigner({ sign: hash => ({ serialized: hash }) });

  // ERC-4337 account
  const helper = new ERC4337Helper(connection);
  const mock = await helper.newAccount('$AccountMock', ['Account', '1']);

  // ERC-4337 Entrypoint domain
  const entrypointDomain = await getDomain(ethers.predeploy.entrypoint.v09);

  // domain cannot be fetched using getDomain(mock) before the mock is deployed
  const domain = { name: 'Account', version: '1', chainId: entrypointDomain.chainId, verifyingContract: mock.address };

  const signUserOp = async userOp =>
    signer
      .signTypedData(entrypointDomain, { PackedUserOperation }, userOp.packed)
      .then(signature => Object.assign(userOp, { signature }));

  return { helper, mock, domain, signer, target, beneficiary, other, signUserOp };
}

describe('Account', function () {
  beforeEach(async function () {
    Object.assign(this, connection, await loadFixture(fixture));
  });

  shouldBehaveLikeAccountCore();
  shouldBehaveLikeAccountHolder();
  shouldBehaveLikeERC1271({ erc7739: true });
  shouldBehaveLikeERC7821();
});
