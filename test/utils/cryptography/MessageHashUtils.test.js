const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { domainType, domainSeparator, hashTypedData } = require('../../helpers/eip712');
const { generators } = require('../../helpers/random');

async function fixture() {
  const mock = await ethers.deployContract('$MessageHashUtils');
  return { mock };
}

describe('MessageHashUtils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('toEthSignedMessageHash', function () {
    it('prefixes bytes32 data correctly', async function () {
      const message = ethers.randomBytes(32);
      const expectedHash = ethers.hashMessage(message);

      await expect(this.mock.getFunction('$toEthSignedMessageHash(bytes32)')(message)).to.eventually.equal(
        expectedHash,
      );
    });

    it('prefixes dynamic length data correctly', async function () {
      const message = ethers.randomBytes(128);
      const expectedHash = ethers.hashMessage(message);

      await expect(this.mock.getFunction('$toEthSignedMessageHash(bytes)')(message)).to.eventually.equal(expectedHash);
    });

    it('version match for bytes32', async function () {
      const message = ethers.randomBytes(32);
      const fixed = await this.mock.getFunction('$toEthSignedMessageHash(bytes32)')(message);
      const dynamic = await this.mock.getFunction('$toEthSignedMessageHash(bytes)')(message);

      expect(fixed).to.equal(dynamic);
    });
  });

  describe('toDataWithIntendedValidatorHash', function () {
    it('returns the digest of `bytes32 messageHash` correctly', async function () {
      const verifier = ethers.Wallet.createRandom().address;
      const message = ethers.randomBytes(32);
      const expectedHash = ethers.solidityPackedKeccak256(
        ['string', 'address', 'bytes32'],
        ['\x19\x00', verifier, message],
      );

      await expect(
        this.mock.getFunction('$toDataWithIntendedValidatorHash(address,bytes32)')(verifier, message),
      ).to.eventually.equal(expectedHash);
    });

    it('returns the digest of `bytes memory message` correctly', async function () {
      const verifier = ethers.Wallet.createRandom().address;
      const message = ethers.randomBytes(128);
      const expectedHash = ethers.solidityPackedKeccak256(
        ['string', 'address', 'bytes'],
        ['\x19\x00', verifier, message],
      );

      await expect(
        this.mock.getFunction('$toDataWithIntendedValidatorHash(address,bytes)')(verifier, message),
      ).to.eventually.equal(expectedHash);
    });

    it('version match for bytes32', async function () {
      const verifier = ethers.Wallet.createRandom().address;
      const message = ethers.randomBytes(32);
      const fixed = await this.mock.getFunction('$toDataWithIntendedValidatorHash(address,bytes)')(verifier, message);
      const dynamic = await this.mock.getFunction('$toDataWithIntendedValidatorHash(address,bytes32)')(
        verifier,
        message,
      );

      expect(fixed).to.equal(dynamic);
    });
  });

  describe('toTypedDataHash', function () {
    it('returns the digest correctly', async function () {
      const domain = {
        name: 'Test',
        version: '1',
        chainId: 1n,
        verifyingContract: ethers.Wallet.createRandom().address,
      };
      const structhash = ethers.randomBytes(32);
      const expectedHash = hashTypedData(domain, structhash);

      await expect(this.mock.$toTypedDataHash(domainSeparator(domain), structhash)).to.eventually.equal(expectedHash);
    });
  });

  describe('ERC-5267', function () {
    const fullDomain = {
      name: generators.string(),
      version: generators.string(),
      chainId: generators.uint256(),
      verifyingContract: generators.address(),
      salt: generators.bytes32(),
    };

    for (let fields = 0; fields < 1 << Object.keys(fullDomain).length; ++fields) {
      const domain = Object.fromEntries(Object.entries(fullDomain).filter((_, i) => fields & (1 << i)));
      const domainTypeName = new ethers.TypedDataEncoder({ EIP712Domain: domainType(domain) }).encodeType(
        'EIP712Domain',
      );

      describe(domainTypeName, function () {
        it('toDomainSeparator(bytes1,string,string,uint256,address,bytes32)', async function () {
          await expect(
            this.mock.$toDomainSeparator(
              ethers.toBeHex(fields),
              ethers.Typed.string(fullDomain.name),
              ethers.Typed.string(fullDomain.version),
              fullDomain.chainId,
              fullDomain.verifyingContract,
              fullDomain.salt,
            ),
          ).to.eventually.equal(domainSeparator(domain));
        });

        it('toDomainSeparator(bytes1,bytes32,bytes32,uint256,address,bytes32)', async function () {
          await expect(
            this.mock.$toDomainSeparator(
              ethers.toBeHex(fields),
              ethers.Typed.bytes32(ethers.id(fullDomain.name)),
              ethers.Typed.bytes32(ethers.id(fullDomain.version)),
              fullDomain.chainId,
              fullDomain.verifyingContract,
              fullDomain.salt,
            ),
          ).to.eventually.equal(domainSeparator(domain));
        });

        it('toDomainTypeHash', async function () {
          await expect(this.mock.$toDomainTypeHash(ethers.toBeHex(fields))).to.eventually.equal(
            ethers.id(domainTypeName),
          );
        });
      });
    }
  });
});
