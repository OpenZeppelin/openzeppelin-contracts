const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { PersonalSignHelper, TypedDataSignHelper } = require('../../helpers/erc7739');

const fixture = async () => {
  const mock = await ethers.deployContract('$ERC7739Utils');
  const domain = {
    name: 'SomeDomain',
    version: '1',
    chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId),
    verifyingContract: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  };
  const otherDomain = {
    name: 'SomeOtherDomain',
    version: '2',
    chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId),
    verifyingContract: '0x92C32cadBc39A15212505B5530aA765c441F306f',
  };
  return { mock, domain, otherDomain };
};

describe('ERC7739Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('encodeTypedDataSig', function () {
    it('wraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const separator = ethers.id('SomeApp');
      const contentsHash = ethers.id('SomeData');
      const contentsType = 'SomeType()';
      const encoded = ethers.concat([
        signature,
        separator,
        contentsHash,
        ethers.toUtf8Bytes(contentsType),
        ethers.toBeHex(contentsType.length, 2),
      ]);

      expect(await this.mock.$encodeTypedDataSig(signature, separator, contentsHash, contentsType)).to.equal(encoded);
    });
  });

  describe('decodeTypedDataSig', function () {
    it('unwraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const separator = ethers.id('SomeApp');
      const contentsHash = ethers.id('SomeData');
      const contentsType = 'SomeType()';
      const encoded = ethers.concat([
        signature,
        separator,
        contentsHash,
        ethers.toUtf8Bytes(contentsType),
        ethers.toBeHex(contentsType.length, 2),
      ]);

      expect(await this.mock.$decodeTypedDataSig(encoded)).to.deep.equal([
        ethers.hexlify(signature),
        separator,
        contentsHash,
        contentsType,
      ]);
    });

    it('returns default empty values if the signature is too short', async function () {
      const encoded = ethers.randomBytes(65); // DOMAIN_SEPARATOR (32 bytes) + CONTENTS (32 bytes) + CONTENTS_TYPE_LENGTH (2 bytes) - 1
      expect(await this.mock.$decodeTypedDataSig(encoded)).to.deep.equal(['0x', ethers.ZeroHash, ethers.ZeroHash, '']);
    });

    it('returns default empty values if the length is invalid', async function () {
      const encoded = ethers.concat([ethers.randomBytes(64), '0x3f']); // Can't be less than 64 bytes
      expect(await this.mock.$decodeTypedDataSig(encoded)).to.deep.equal(['0x', ethers.ZeroHash, ethers.ZeroHash, '']);
    });
  });

  describe('personalSignStructhash', function () {
    it('should produce a personal signature EIP-712 nested type', async function () {
      const text = 'Hello, world!';

      expect(await this.mock.$personalSignStructHash(ethers.hashMessage(text))).to.equal(
        ethers.TypedDataEncoder.hashStruct('PersonalSign', PersonalSignHelper.types, PersonalSignHelper.prepare(text)),
      );
    });
  });

  describe('typedDataSignStructHash', function () {
    it('should match the typed data nested struct hash', async function () {
      const message = TypedDataSignHelper.prepare({ something: ethers.randomBytes(32) }, this.domain);

      const { types, contentsType } = TypedDataSignHelper.from('SomeType', { something: 'bytes32' });
      const contentsHash = ethers.TypedDataEncoder.hashStruct('SomeType', types, message.contents);
      const hash = ethers.TypedDataEncoder.hashStruct('TypedDataSign', types, message);

      expect(
        await this.mock.$typedDataSignStructHash(
          contentsType,
          contentsHash,
          message.fields,
          message.name,
          message.version,
          message.verifyingContract,
          message.salt,
          message.extensions,
        ),
      ).to.equal(hash);
    });
  });

  describe('typedDataSignTypehash', function () {
    it('should match', async function () {
      const { types, contentsType, contentsName } = TypedDataSignHelper.from('FooType', {
        foo: 'address',
        bar: 'uint256',
      });
      const typedDataSigType = ethers.TypedDataEncoder.from(types).encodeType('TypedDataSign');

      expect(await this.mock.$typedDataSignTypehash(contentsType)).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes(typedDataSigType)),
      );

      expect(await this.mock.$typedDataSignTypehash(contentsType, ethers.Typed.string(contentsName))).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes(typedDataSigType)),
      );
    });

    it('should revert with InvalidContentsType if the type is invalid', async function () {
      await expect(this.mock.$typedDataSignTypehash('')).to.be.revertedWithCustomError(
        this.mock,
        'InvalidContentsType',
      );
    });
  });

  describe('tryValidateContentsType', function () {
    const forbiddenFirstChars = 'abcdefghijklmnopqrstuvwxyz(';
    const forbiddenChars = ', )\x00';

    for (const { descr, contentsType, contentsTypeName } of [].concat(
      {
        descr: 'should return true for a valid type',
        contentsType: 'SomeType(address foo,uint256 bar)',
        contentsTypeName: 'SomeType',
      },
      {
        descr: 'should return false for an empty type',
        contentsType: '',
        contentsTypeName: null,
      },
      {
        descr: 'should return false if no [(] is present',
        contentsType: 'SomeType',
        contentsTypeName: null,
      },
      forbiddenFirstChars.split('').map(char => ({
        descr: `should return false if starts with [${char}]`,
        contentsType: `${char}SomeType()`,
        contentsTypeName: null,
      })),
      forbiddenChars.split('').map(char => ({
        descr: `should return false if contains [${char}]`,
        contentsType: `SomeType${char}(address foo,uint256 bar)`,
        contentsTypeName: null,
      })),
    )) {
      it(descr, async function () {
        expect(await this.mock.$tryValidateContentsType(contentsType)).to.equal(contentsTypeName ?? '');
      });
    }
  });
});
