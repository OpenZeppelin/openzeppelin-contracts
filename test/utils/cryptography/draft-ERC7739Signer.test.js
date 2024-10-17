const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { domainSeparator, getDomain, formatType } = require('../../helpers/eip712');

// Helpers
function prefixMessage(message) {
  if (typeof message === 'string') {
    message = ethers.toUtf8Bytes(message);
  }
  return ethers.concat([ethers.toUtf8Bytes(ethers.MessagePrefix), ethers.toUtf8Bytes(String(message.length)), message]);
}

// Constant
const MAGIC_VALUE = '0x1626ba7e';

// Types
const PersonalSign = formatType({
  prefixed: 'bytes',
});

const TypedDataSign = formatType({
  contents: 'SomeType',
  fields: 'bytes1',
  name: 'string',
  version: 'string',
  chainId: 'uint256',
  verifyingContract: 'address',
  salt: 'bytes32',
  extensions: 'uint256[]',
});

const SomeType = formatType({
  something: 'bytes32',
});

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
      const types = { PersonalSign };

      const message = 'Hello, world!';
      const hash = ethers.hashMessage(message);
      const signature = await this.eoa.signTypedData(this.domain, types, { prefixed: prefixMessage(message) });

      expect(await this.mock.isValidSignature(hash, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns true for a valid typed data signature', async function () {
      const types = { TypedDataSign, SomeType };

      // Dummy app domain, different from the ERC7739Signer's domain
      const appDomain = {
        name: 'SomeApp',
        version: '1',
        chainId: this.domain.chainId,
        verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      };

      const message = {
        contents: { something: ethers.randomBytes(32) },
        fields: '0x0f',
        ...this.domain,
        salt: ethers.ZeroHash,
        extensions: [],
      };

      const hash = ethers.TypedDataEncoder.hash(appDomain, types, message);
      const signature = await this.eoa.signTypedData(appDomain, types, message);
      const contentsHash = ethers.TypedDataEncoder.hashStruct('SomeType', types, message.contents);
      const contentsType = ethers.TypedDataEncoder.from(types).encodeType('SomeType');

      const encoded = ethers.concat([
        signature,
        domainSeparator(appDomain),
        contentsHash,
        ethers.toUtf8Bytes(contentsType),
        ethers.toBeHex(ethers.dataLength(ethers.toUtf8Bytes(contentsType)), 2),
      ]);

      expect(await this.mock.isValidSignature(hash, encoded)).to.equal(MAGIC_VALUE);
    });

    it('returns false for an invalid signature', async function () {
      const types = { PersonalSign };

      const hash = ethers.hashMessage('Message the app expects');
      const signature = await this.eoa.signTypedData(this.domain, types, {
        prefixed: prefixMessage('Message signed is different'),
      });

      expect(await this.mock.isValidSignature(hash, signature)).to.not.equal(MAGIC_VALUE);
    });
  });
});
