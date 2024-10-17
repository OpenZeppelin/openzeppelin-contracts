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
  return { eoa, mock, domain };
}

describe('ERC7739Signer', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('isValidSignature', function () {
    it('returns true for a valid personal signature', async function () {
      const message = PersonalSignHelper.prepare('Hello, world!');

      const hash = PersonalSignHelper.hash(message);
      const signature = await PersonalSignHelper.sign(this.eoa, message, this.domain);

      expect(await this.mock.isValidSignature(hash, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns true for a valid typed data signature', async function () {
      // Dummy app domain, different from the ERC7739Signer's domain
      const appDomain = {
        name: 'SomeApp',
        version: '1',
        chainId: this.domain.chainId,
        verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      };

      const message = TypedDataSignHelper.prepare({ something: ethers.randomBytes(32) }, this.domain);

      const helper = new TypedDataSignHelper('SomeType', { something: 'bytes32' });
      const hash = helper.hash(message, appDomain);
      const signature = await helper.sign(this.eoa, message, appDomain);

      expect(await this.mock.isValidSignature(hash, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns false for an invalid signature', async function () {
      const message = PersonalSignHelper.prepare('Message signed is different');

      const hash = PersonalSignHelper.hash('Message the app expects'); // different text
      const signature = await PersonalSignHelper.sign(this.eoa, message, this.domain);

      expect(await this.mock.isValidSignature(hash, signature)).to.not.equal(MAGIC_VALUE);
    });
  });
});
