const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { Permit } = require('../../helpers/eip712');
const { ERC4337Utils, PersonalSign } = require('../../helpers/erc7739');

const details = ERC4337Utils.getContentsDetail({ Permit });

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
      const contentsDescr = 'SomeType()';
      const encoded = ethers.concat([
        signature,
        appSeparator,
        contentsHash,
        ethers.toUtf8Bytes(contentsDescr),
        ethers.toBeHex(contentsDescr.length, 2),
      ]);

      await expect(
        this.mock.$encodeTypedDataSig(signature, appSeparator, contentsHash, contentsDescr),
      ).to.eventually.equal(encoded);
    });
  });

  describe('decodeTypedDataSig', function () {
    it('unwraps a typed data signature', async function () {
      const signature = ethers.randomBytes(65);
      const appSeparator = ethers.id('SomeApp');
      const contentsHash = ethers.id('SomeData');
      const contentsDescr = 'SomeType()';
      const encoded = ethers.concat([
        signature,
        appSeparator,
        contentsHash,
        ethers.toUtf8Bytes(contentsDescr),
        ethers.toBeHex(contentsDescr.length, 2),
      ]);

      await expect(this.mock.$decodeTypedDataSig(encoded)).to.eventually.deep.equal([
        ethers.hexlify(signature),
        appSeparator,
        contentsHash,
        contentsDescr,
      ]);
    });

    it('returns default empty values if the signature is too short', async function () {
      const encoded = ethers.randomBytes(65); // DOMAIN_SEPARATOR (32 bytes) + CONTENTS (32 bytes) + CONTENTS_TYPE_LENGTH (2 bytes) - 1
      await expect(this.mock.$decodeTypedDataSig(encoded)).to.eventually.deep.equal([
        '0x',
        ethers.ZeroHash,
        ethers.ZeroHash,
        '',
      ]);
    });

    it('returns default empty values if the length is invalid', async function () {
      const encoded = ethers.concat([ethers.randomBytes(64), '0x3f']); // Can't be less than 64 bytes
      await expect(this.mock.$decodeTypedDataSig(encoded)).to.eventually.deep.equal([
        '0x',
        ethers.ZeroHash,
        ethers.ZeroHash,
        '',
      ]);
    });
  });

  describe('personalSignStructhash', function () {
    it('should produce a personal signature EIP-712 nested type', async function () {
      const text = 'Hello, world!';

      await expect(this.mock.$personalSignStructHash(ethers.hashMessage(text))).to.eventually.equal(
        ethers.TypedDataEncoder.hashStruct('PersonalSign', { PersonalSign }, ERC4337Utils.preparePersonalSign(text)),
      );
    });
  });

  describe('typedDataSignStructHash', function () {
    it('should match the typed data nested struct hash', async function () {
      const message = ERC4337Utils.prepareSignTypedData(this.permit, this.domain);

      const contentsHash = ethers.TypedDataEncoder.hashStruct('Permit', { Permit }, this.permit);
      const hash = ethers.TypedDataEncoder.hashStruct('TypedDataSign', details.allTypes, message);

      const domainBytes = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'uint256', 'address', 'bytes32'],
        [
          ethers.id(this.domain.name),
          ethers.id(this.domain.version),
          this.domain.chainId,
          this.domain.verifyingContract,
          ethers.ZeroHash,
        ],
      );

      await expect(
        this.mock.$typedDataSignStructHash(
          details.contentsTypeName,
          ethers.Typed.string(details.contentsDescr),
          contentsHash,
          domainBytes,
        ),
      ).to.eventually.equal(hash);
      await expect(
        this.mock.$typedDataSignStructHash(details.contentsDescr, contentsHash, domainBytes),
      ).to.eventually.equal(hash);
    });
  });

  describe('typedDataSignTypehash', function () {
    it('should match', async function () {
      const typedDataSignType = ethers.TypedDataEncoder.from(details.allTypes).encodeType('TypedDataSign');

      await expect(
        this.mock.$typedDataSignTypehash(
          details.contentsTypeName,
          typedDataSignType.slice(typedDataSignType.indexOf(')') + 1),
        ),
      ).to.eventually.equal(ethers.keccak256(ethers.toUtf8Bytes(typedDataSignType)));
    });
  });

  describe('decodeContentsDescr', function () {
    const forbiddenChars = ', )\x00';

    for (const { descr, contentsDescr, contentTypeName, contentType } of [].concat(
      {
        descr: 'should parse a valid descriptor (implicit)',
        contentsDescr: 'SomeType(address foo,uint256 bar)',
        contentTypeName: 'SomeType',
      },
      {
        descr: 'should parse a valid descriptor (explicit)',
        contentsDescr: 'A(C c)B(A a)C(uint256 v)B',
        contentTypeName: 'B',
        contentType: 'A(C c)B(A a)C(uint256 v)',
      },
      { descr: 'should return nothing for an empty descriptor', contentsDescr: '', contentTypeName: null },
      { descr: 'should return nothing if no [(] is present', contentsDescr: 'SomeType', contentTypeName: null },
      {
        descr: 'should return nothing if starts with [(] (implicit)',
        contentsDescr: '(SomeType(address foo,uint256 bar)',
        contentTypeName: null,
      },
      {
        descr: 'should return nothing if starts with [(] (explicit)',
        contentsDescr: '(SomeType(address foo,uint256 bar)(SomeType',
        contentTypeName: null,
      },
      forbiddenChars.split('').map(char => ({
        descr: `should return nothing if contains [${char}] (implicit)`,
        contentsDescr: `SomeType${char}(address foo,uint256 bar)`,
        contentTypeName: null,
      })),
      forbiddenChars.split('').map(char => ({
        descr: `should return nothing if contains [${char}] (explicit)`,
        contentsDescr: `SomeType${char}(address foo,uint256 bar)SomeType${char}`,
        contentTypeName: null,
      })),
    )) {
      it(descr, async function () {
        await expect(this.mock.$decodeContentsDescr(contentsDescr)).to.eventually.deep.equal([
          contentTypeName ?? '',
          contentTypeName ? (contentType ?? contentsDescr) : '',
        ]);
      });
    }
  });
});
