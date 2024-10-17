const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getDomain } = require('../../helpers/eip712');
const { PersonalSignHelper, TypedDataSignHelper } = require('../../helpers/erc7739');

// Constant
const MAGIC_VALUE = '0x1626ba7e';

// Fixture
async function fixture() {
  // Using getSigners fails, probably due to a bad implementation of signTypedData somewhere in hardhat
  const eoa = await ethers.Wallet.createRandom();
  const mock = await ethers.deployContract('$ERC7739SignerMock', [eoa]);
  const domain = await getDomain(mock);

  // Dummy app domain, different from the ERC7739Signer's domain
  const appDomain = {
    name: 'SomeApp',
    version: '1',
    chainId: domain.chainId,
    verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  };

  return { eoa, mock, domain, appDomain };
}

describe('ERC7739Signer', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('isValidSignature', function () {
    it('returns true for a valid personal signature', async function () {
      const text = 'Hello, world!';

      const hash = PersonalSignHelper.hash(text);
      const signature = await PersonalSignHelper.sign(this.eoa, text, this.domain);

      expect(await this.mock.isValidSignature(hash, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns false for an invalid personal signature', async function () {
      const hash = PersonalSignHelper.hash('Message the app expects');
      const signature = await PersonalSignHelper.sign(this.eoa, 'Message signed is different', this.domain);

      expect(await this.mock.isValidSignature(hash, signature)).to.not.equal(MAGIC_VALUE);
    });

    it('returns true for a valid typed data signature', async function () {
      const helper = TypedDataSignHelper.from('SomeType', { something: 'bytes32' });

      const appMessage = { something: ethers.randomBytes(32) };
      const message = TypedDataSignHelper.prepare(appMessage, this.domain);

      const hash = helper.hash(appMessage, this.appDomain);
      const signature = await helper.sign(this.eoa, message, this.appDomain);

      expect(await this.mock.isValidSignature(hash, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns false for an invalid typed data signature', async function () {
      const helper = TypedDataSignHelper.from('SomeType', { something: 'bytes32' });

      const appMessage = { something: ethers.randomBytes(32) };
      const signedMessage = TypedDataSignHelper.prepare({ something: ethers.randomBytes(32) }, this.domain);

      const hash = helper.hash(appMessage, this.appDomain);
      const signature = await helper.sign(this.eoa, signedMessage, this.appDomain);

      expect(await this.mock.isValidSignature(hash, signature)).to.not.equal(MAGIC_VALUE);
    });
  });
});
