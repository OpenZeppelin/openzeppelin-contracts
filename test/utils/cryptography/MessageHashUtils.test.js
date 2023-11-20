const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

const { toDataWithIntendedValidatorHash } = require('../../helpers/sign');
const { domainSeparator, hashTypedData } = require('../../helpers/eip712');

async function fixture() {
  const messageHashUtils = await ethers.deployContract('$MessageHashUtils');

  const message = ethers.getBytes('0xabcd');
  const messageHash = ethers.getBytes(ethers.sha256(message));
  const verifyingAddress = ethers.Wallet.createRandom().address;

  return { messageHashUtils, message, messageHash, verifyingAddress };
}

describe('MessageHashUtils', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('toEthSignedMessageHash', function () {
    it('prefixes bytes32 data correctly', async function () {
      expect(await this.messageHashUtils.getFunction('$toEthSignedMessageHash(bytes32)')(this.messageHash)).to.equal(
        ethers.hashMessage(this.messageHash),
      );
    });

    it('prefixes dynamic length data correctly', async function () {
      expect(await this.messageHashUtils.getFunction('$toEthSignedMessageHash(bytes)')(this.message)).to.equal(
        ethers.hashMessage(this.message),
      );
    });
  });

  describe('toDataWithIntendedValidatorHash', function () {
    it('returns the digest correctly', async function () {
      expect(
        await this.messageHashUtils.$toDataWithIntendedValidatorHash(this.verifyingAddress, this.message),
      ).to.equal(toDataWithIntendedValidatorHash(this.verifyingAddress, this.message));
    });
  });

  describe('toTypedDataHash', function () {
    it('returns the digest correctly', async function () {
      const domain = {
        name: 'Test',
        version: 1,
        chainId: 1,
        verifyingContract: this.verifyingAddress,
      };
      const structhash = ethers.hexlify(ethers.randomBytes(32));
      const expectedDomainSeparator = domainSeparator(domain);
      expect(await this.messageHashUtils.$toTypedDataHash(expectedDomainSeparator, structhash)).to.equal(
        hashTypedData(domain, structhash),
      );
    });
  });
});
