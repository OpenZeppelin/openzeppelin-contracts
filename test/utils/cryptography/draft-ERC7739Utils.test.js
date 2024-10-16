const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const {
  hashTypedData,
  domainSeparator,
  hashNestedTypedDataType,
  hashNestedTypedDataStruct,
} = require('../../helpers/eip712');

const fixture = async () => {
  const mock = await ethers.deployContract('$ERC7739Utils');
  const domain = {
    name: 'SomeDomain',
    version: '1',
    chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId),
    verifyingContract: await mock.getAddress(),
  };
  return { mock, domain };
};

describe('ERC7739Utils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('decodeSignature', function () {
    it('unwraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const separator = ethers.id('SomeApp');
      const contents = ethers.id('SomeData');
      const contentsType = ethers.toUtf8Bytes('SomeType()');
      const contentsTypeLength = ethers.toBeHex(ethers.dataLength(contentsType), 2);

      const encoded = ethers.concat([signature, separator, contents, contentsType, contentsTypeLength]);
      expect(await this.mock.getFunction('$decodeSignature')(encoded)).to.deep.equal([
        ethers.hexlify(signature),
        separator,
        contents,
        ethers.hexlify(contentsType),
      ]);
    });

    it('returns default empty values if the signature is too short', async function () {
      const encoded = ethers.randomBytes(65); // DOMAIN_SEPARATOR (32 bytes) + CONTENTS (32 bytes) + CONTENTS_TYPE_LENGTH (2 bytes) - 1
      expect(await this.mock.getFunction('$decodeSignature')(encoded)).to.deep.equal([
        '0x',
        ethers.ZeroHash,
        ethers.ZeroHash,
        '0x',
      ]);
    });

    it('returns default empty values if the length is invalid', async function () {
      const encoded = ethers.concat([ethers.randomBytes(64), '0x3f']); // Can't be less than 64 bytes
      expect(await this.mock.getFunction('$decodeSignature')(encoded)).to.deep.equal([
        '0x',
        ethers.ZeroHash,
        ethers.ZeroHash,
        '0x',
      ]);
    });
  });

  describe('encodeSignature', function () {
    it('wraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const separator = ethers.id('SomeApp');
      const contents = ethers.id('SomeData');
      const contentsType = ethers.toUtf8Bytes('SomeType()');
      const contentsTypeLength = ethers.toBeHex(ethers.dataLength(contentsType), 2);

      const encoded = ethers.concat([signature, separator, contents, contentsType, contentsTypeLength]);
      expect(await this.mock.getFunction('$encodeSignature')(signature, separator, contents, contentsType)).to.equal(
        encoded,
      );
    });
  });

  describe('toNestedPersonalSignHash', function () {
    it('should produce a personal signature EIP712 nested type', async function () {
      const contents = ethers.randomBytes(32);
      const personalSignStructHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32'],
        [
          ethers.solidityPackedKeccak256(['string'], ['PersonalSign(bytes prefixed)']),
          ethers.solidityPackedKeccak256(['string', 'bytes32'], ['\x19Ethereum Signed Message:\n32', contents]),
        ],
      );
      expect(await this.mock.getFunction('$toNestedPersonalSignHash')(domainSeparator(this.domain), contents)).to.equal(
        hashTypedData(this.domain, personalSignStructHash),
      );
    });
  });

  describe('toNestedTypedDataHash', function () {
    it('should produce a typed data EIP712 nested type', async function () {
      const contents = ethers.randomBytes(32);
      const contentsTypeName = 'SomeType';
      const contentsType = `${contentsTypeName}()`;
      const typedDataNestedStructHash = hashNestedTypedDataStruct(this.domain, contents, contentsType);
      const expected = hashTypedData(this.domain, typedDataNestedStructHash);
      expect(
        await this.mock.getFunction('$toNestedTypedDataHash')(domainSeparator(this.domain), typedDataNestedStructHash),
      ).to.equal(expected);
    });
  });

  describe('NESTED_TYPED_DATA_TYPEHASH', function () {
    it('should match without validation', async function () {
      const contentsTypeName = 'FooType';
      const contentsType = `${contentsTypeName}(address foo,uint256 bar)`;
      expect(await this.mock.getFunction('$NESTED_TYPED_DATA_TYPEHASH')(ethers.toUtf8Bytes(contentsType))).to.equal(
        hashNestedTypedDataType(contentsTypeName, contentsType),
      );
    });

    it('should match with validation', async function () {
      const contentsTypeName = 'FooType';
      const contentsType = `${contentsTypeName}(address foo,uint256 bar)`;
      expect(await this.mock.getFunction('$NESTED_TYPED_DATA_TYPEHASH')(ethers.toUtf8Bytes(contentsType))).to.equal(
        hashNestedTypedDataType(contentsTypeName, contentsType),
      );
    });

    it('should revert with InvalidContentsType if the type is invalid', async function () {
      await expect(this.mock.getFunction('$NESTED_TYPED_DATA_TYPEHASH')('0x')).to.be.revertedWithCustomError(
        this.mock,
        'InvalidContentsType',
      );
    });
  });

  describe('tryValidateContentsType', function () {
    // Note: the implementation is a looser interpretaion of the ERC (as documented in the code) that allows lowercase
    // first letters.
    //
    // const forbiddenFirstChars = 'abcdefghijklmnopqrstuvwxyz(';
    const forbiddenFirstChars = '(';
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
        expect(await this.mock.getFunction('$tryValidateContentsType')(ethers.toUtf8Bytes(contentsType))).to.deep.equal(
          [!!contentsTypeName, ethers.hexlify(ethers.toUtf8Bytes(contentsTypeName ?? ''))],
        );
      });
    }
  });

  describe('typedDataNestedStructHash', function () {
    it('should match the typed data nested struct hash', async function () {
      const contents = ethers.randomBytes(32);
      const contentsTypeName = 'SomeType';
      const contentsType = `${contentsTypeName}(address foo,uint256 bar)`;
      const typedDataNestedStructHash = hashNestedTypedDataStruct(this.domain, contents, contentsType);
      expect(
        await this.mock.getFunction('$typedDataNestedStructHash')(
          ethers.toUtf8Bytes(contentsType),
          contents,
          this.domain.name,
          this.domain.version,
          this.domain.verifyingContract,
          ethers.ZeroHash,
          [],
        ),
      ).to.equal(typedDataNestedStructHash);
    });
  });
});
