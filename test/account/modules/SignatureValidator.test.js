const { ethers } = require('hardhat');
const { loadFixture, setBalance } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeSignatureValidator } = require('./SignatureValidator.behavior');
const { ERC4337Helper } = require('../../helpers/erc4337');
const { BooleanSigner } = require('../../helpers/signers');
const { impersonate } = require('../../helpers/account');

async function fixture() {
  const helper = new ERC4337Helper('$AccountERC7579');
  const target = await ethers.deployContract('CallReceiverMock');
  const signer = new BooleanSigner();
  const validator = await ethers.deployContract('SignatureValidatorMock');
  const erc7579Account = await helper.newAccount(['AccountERC7579', '1']);
  const domain = {
    name: 'AccountERC7579',
    version: '1',
    chainId: helper.chainId,
    verifyingContract: erc7579Account.address,
  };

  await setBalance(erc7579Account.target, ethers.parseEther('1'));
  await erc7579Account.deploy();
  const erc7579AccountAsSigner = await impersonate(erc7579Account.target);

  return { ...helper, target, signer, validator, erc7579Account, erc7579AccountAsSigner, domain };
}

describe('SignatureValidator', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeSignatureValidator();
});
