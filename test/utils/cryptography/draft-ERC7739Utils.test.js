const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { Permit } = require('../../helpers/eip712');
const { PersonalSignHelper, TypedDataSignHelper } = require('../../helpers/erc7739');

// Helper for ERC20Permit applications
const helper = TypedDataSignHelper.from({ Permit });

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
  const permit = {
    owner: '0x1ab5E417d9AF00f1ca9d159007e12c401337a4bb',
    spender: '0xD68E96620804446c4B1faB3103A08C98d4A8F55f',
    value: 1_000_000n,
    nonce: 0n,
    deadline: ethers.MaxUint256,
  };
  return { mock, domain, otherDomain, permit };
};

describe('ERC7739Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('encodeTypedDataSig', function () {
    it('wraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const appSeparator = ethers.id('SomeApp');
      const contentsHash = ethers.id('SomeData');
      const contentsType = 'SomeType()';
      const encoded = ethers.concat([
        signature,
        appSeparator,
        contentsHash,
        ethers.toUtf8Bytes(contentsType),
        ethers.toBeHex(contentsType.length, 2),
      ]);

      expect(await this.mock.$encodeTypedDataSig(signature, appSeparator, contentsHash, contentsType)).to.equal(
        encoded,
      );
    });
  });

  describe('decodeTypedDataSig', function () {
    it('unwraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const appSeparator = ethers.id('SomeApp');
      const contentsHash = ethers.id('SomeData');
      const contentsType = 'SomeType()';
      const encoded = ethers.concat([
        signature,
        appSeparator,
        contentsHash,
        ethers.toUtf8Bytes(contentsType),
        ethers.toBeHex(contentsType.length, 2),
      ]);

      expect(await this.mock.$decodeTypedDataSig(encoded)).to.deep.equal([
        ethers.hexlify(signature),
        appSeparator,
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
      const message = TypedDataSignHelper.prepare(this.permit, this.domain);

      const contentsHash = ethers.TypedDataEncoder.hashStruct('Permit', helper.types, message.contents);
      const hash = ethers.TypedDataEncoder.hashStruct('TypedDataSign', helper.allTypes, message);

      expect(
        await this.mock.$typedDataSignStructHash(
          helper.contentsType,
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
      const typedDataSigType = ethers.TypedDataEncoder.from(helper.allTypes).encodeType('TypedDataSign');
      const typedDataSigTypeHash = ethers.keccak256(ethers.toUtf8Bytes(typedDataSigType));

      expect(await this.mock.$typedDataSignTypehash(helper.contentsType)).to.equal(typedDataSigTypeHash);

      expect(
        await this.mock.$typedDataSignTypehash(helper.contentsType, ethers.Typed.string(helper.contentsTypeName)),
      ).to.equal(typedDataSigTypeHash);
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
