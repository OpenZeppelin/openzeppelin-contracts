const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const {
  hashTypedData,
  domainSeparator,
  hashTypedDataEnvelopeType,
  hashTypedDataEnvelopeStruct,
} = require('../../helpers/eip712');

const fixture = async () => {
  const mock = await ethers.deployContract('$MessageEnvelopeUtils');
  const domain = {
    name: 'SomeDomain',
    version: '1',
    chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId),
    verifyingContract: await mock.getAddress(),
  };
  return { mock, domain };
};

describe('MessageEnvelopeUtils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('unwrapTypedDataSig', function () {
    it('unwraps a typed data envelope', async function () {
      const originalSig = ethers.randomBytes(65);
      const appSeparator = ethers.id('SomeApp');
      const contents = ethers.id('SomeData');
      const contentsType = ethers.toUtf8Bytes('SomeType()');
      const contentsTypeLength = ethers.toBeHex(ethers.dataLength(contentsType), 2);

      const signature = ethers.concat([originalSig, appSeparator, contents, contentsType, contentsTypeLength]);

      const unwrapped = await this.mock.getFunction('$unwrapTypedDataSig')(signature);

      expect(unwrapped).to.deep.eq([ethers.hexlify(originalSig), appSeparator, contents, ethers.hexlify(contentsType)]);
    });
  });

  describe('wrapTypedDataSig', function () {
    it('wraps a typed data envelope', async function () {
      const originalSig = ethers.randomBytes(65);
      const appSeparator = ethers.id('SomeApp');
      const contents = ethers.id('SomeData');
      const contentsType = ethers.toUtf8Bytes('SomeType()');
      const contentsTypeLength = ethers.toBeHex(ethers.dataLength(contentsType), 2);

      const expected = ethers.concat([originalSig, appSeparator, contents, contentsType, contentsTypeLength]);

      const wrapped = await this.mock.getFunction('$wrapTypedDataSig')(
        originalSig,
        appSeparator,
        contents,
        contentsType,
      );

      expect(wrapped).to.equal(expected);
    });
  });

  describe('toPersonalSignEnvelopeHash', function () {
    it('should produce a personal signature EIP712 envelope', async function () {
      const contents = ethers.randomBytes(32);
      const personalSignStructHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32'],
        [
          ethers.solidityPackedKeccak256(['string'], ['PersonalSign(bytes prefixed)']),
          ethers.solidityPackedKeccak256(['string', 'bytes32'], ['\x19Ethereum Signed Message:\n32', contents]),
        ],
      );
      expect(
        await this.mock.getFunction('$toPersonalSignEnvelopeHash')(domainSeparator(this.domain), contents),
      ).to.equal(hashTypedData(this.domain, personalSignStructHash));
    });
  });

  describe('toTypedDataEnvelopeHash', function () {
    it('should produce a typed data EIP712 envelope', async function () {
      const contents = ethers.randomBytes(32);
      const contentsTypeName = 'SomeType';
      const contentsType = `${contentsTypeName}()`;
      const typedDataEnvelopeStructHash = hashTypedDataEnvelopeStruct(
        this.domain,
        contents,
        contentsTypeName,
        contentsType,
      );
      const expected = hashTypedData(this.domain, typedDataEnvelopeStructHash);
      expect(
        await this.mock.getFunction('$toTypedDataEnvelopeHash')(
          domainSeparator(this.domain),
          typedDataEnvelopeStructHash,
        ),
      ).to.equal(expected);
    });
  });

  describe('TYPED_DATA_ENVELOPE_TYPEHASH', function () {
    it('should match the hardcoded value', async function () {
      const contentsTypeName = 'FooType';
      const contentsType = `${contentsTypeName}(address foo,uint256 bar)`;
      expect(await this.mock.getFunction('$TYPED_DATA_ENVELOPE_TYPEHASH')(ethers.toUtf8Bytes(contentsType))).to.equal(
        hashTypedDataEnvelopeType(contentsTypeName, contentsType),
      );
    });
  });

  describe('tryValidateContentsType', function () {
    it('should return true for a valid type', async function () {
      const contentsType = ethers.toUtf8Bytes('SomeType(address foo,uint256 bar)');
      const [valid, type] = await this.mock.getFunction('$tryValidateContentsType')(contentsType);
      expect(valid).to.be.true;
      expect(type).to.equal(ethers.hexlify(ethers.toUtf8Bytes('SomeType')));
    });

    it('should return false for an empty type', async function () {
      const [valid, type] = await this.mock.getFunction('$tryValidateContentsType')('0x');
      expect(valid).to.be.false;
      expect(type).to.equal('0x');
    });

    const invalidInitialCharacters = new Array('abcdefghijklmnopqrstuvwxyz(');
    for (const char of invalidInitialCharacters) {
      it(`should return false if starting with ${char}`, async function () {
        const [valid, type] = await this.mock.getFunction('$tryValidateContentsType')(
          ethers.toUtf8Bytes(`${char}SomeType()`),
        );
        expect(valid).to.be.false;
        expect(type).to.equal('0x');
      });
    }

    const forbidenChars = [',', ' ', ')', '\x00'];
    for (const char of forbidenChars) {
      it(`should return false if it has [${char}] char`, async function () {
        const [valid, type] = await this.mock.getFunction('$tryValidateContentsType')(
          ethers.toUtf8Bytes(`SomeType${char}`),
        );
        expect(valid).to.be.false;
        expect(type).to.equal('0x');
      });
    }
  });

  describe('typedDataEnvelopeStructHash', function () {
    it('should match the typed data envelope struct hash', async function () {
      const contents = ethers.randomBytes(32);
      const contentsTypeName = 'SomeType';
      const contentsType = `${contentsTypeName}(address foo,uint256 bar)`;
      const typedDataEnvelopeStructHash = hashTypedDataEnvelopeStruct(
        this.domain,
        contents,
        contentsTypeName,
        contentsType,
      );
      expect(
        await this.mock.getFunction('$typedDataEnvelopeStructHash')(
          ethers.toUtf8Bytes(contentsType),
          contents,
          this.domain.name,
          this.domain.version,
          this.domain.verifyingContract,
          ethers.ZeroHash,
          [],
        ),
      ).to.equal(typedDataEnvelopeStructHash);
    });
  });
});
