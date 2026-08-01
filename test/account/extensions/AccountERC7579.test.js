const { ethers, predeploy } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain } = require('../../helpers/eip712');
const { ERC4337Helper } = require('../../helpers/erc4337');
const { PackedUserOperation } = require('../../helpers/eip712-types');

const { shouldBehaveLikeAccountCore } = require('../Account.behavior');
const { shouldBehaveLikeAccountERC7579 } = require('./AccountERC7579.behavior');
const { shouldBehaveLikeERC1271 } = require('../../utils/cryptography/ERC1271.behavior');

const fixtureWithValidator = () => fixture(true); // parameters not supported by `loadFixture`
const fixtureWithoutValidator = () => fixture(false);

async function fixture(withValidator) {
  // EOAs and environment
  const [other] = await ethers.getSigners();
  const target = await ethers.deployContract('CallReceiverMock');
  const anotherTarget = await ethers.deployContract('CallReceiverMock');

  // ERC-7579 validator
  const validator = withValidator ? await ethers.deployContract('$ERC7579ValidatorMock') : null;

  // ERC-4337 signer
  const signer = ethers.Wallet.createRandom();

  // ERC-4337 account
  const helper = new ERC4337Helper();
  const mock = await helper.newAccount(
    validator ? '$AccountERC7579Mock' : '$AccountERC7579NativeValidationMock',
    validator ? [validator, ethers.solidityPacked(['address'], [signer.address])] : [signer.address],
  );

  // ERC-4337 Entrypoint domain
  const entrypointDomain = await getDomain(predeploy.entrypoint.v09);

  return { helper, validator, mock, entrypointDomain, signer, target, anotherTarget, other };
}

[true, false].forEach(withValidator =>
  describe(`AccountERC7579 ${withValidator ? '' : 'native signer validation fallback'}`, function () {
    beforeEach(async function () {
      Object.assign(this, await loadFixture(withValidator ? fixtureWithValidator : fixtureWithoutValidator));
      this.signer.signMessage = message =>
        ethers.Wallet.prototype.signMessage
          .bind(this.signer)(message)
          .then(sign => (withValidator ? ethers.concat([this.validator.target, sign]) : sign));
      this.signer.signTypedData = (domain, types, values) =>
        ethers.Wallet.prototype.signTypedData
          .bind(this.signer)(domain, types, values)
          .then(sign => (withValidator ? ethers.concat([this.validator.target, sign]) : sign));
      this.signUserOp = userOp =>
        ethers.Wallet.prototype.signTypedData
          .bind(this.signer)(this.entrypointDomain, { PackedUserOperation }, userOp.packed)
          .then(signature => Object.assign(userOp, { signature }));

      this.userOp = withValidator ? { nonce: ethers.zeroPadBytes(ethers.hexlify(this.validator.target), 32) } : {};
    });

    if (withValidator) {
      shouldBehaveLikeAccountCore();
      shouldBehaveLikeAccountERC7579();
    }
    shouldBehaveLikeERC1271();
  }),
);
