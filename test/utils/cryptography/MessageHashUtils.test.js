require('@openzeppelin/test-helpers');
const { toEthSignedMessageHash, toDataWithIntendedValidatorHash } = require('../../helpers/sign');
const { domainSeparator, hashTypedData } = require('../../helpers/eip712');

const { expect } = require('chai');

const MessageHashUtils = artifacts.require('$MessageHashUtils');

contract('MessageHashUtils', function () {
  beforeEach(async function () {
    this.messageHashUtils = await MessageHashUtils.new();

    this.message = '0x' + Buffer.from('abcd').toString('hex');
    this.messageHash = web3.utils.sha3(this.message);
    this.verifyingAddress = web3.utils.toChecksumAddress(web3.utils.randomHex(20));
  });

  context('toEthSignedMessageHash', function () {
    it('prefixes bytes32 data correctly', async function () {
      expect(await this.messageHashUtils.methods['$toEthSignedMessageHash(bytes32)'](this.messageHash)).to.equal(
        toEthSignedMessageHash(this.messageHash),
      );
    });

    it('prefixes dynamic length data correctly', async function () {
      expect(await this.messageHashUtils.methods['$toEthSignedMessageHash(bytes)'](this.message)).to.equal(
        toEthSignedMessageHash(this.message),
      );
    });
  });

  context('toDataWithIntendedValidatorHash', function () {
    it('returns the digest correctly', async function () {
      expect(
        await this.messageHashUtils.$toDataWithIntendedValidatorHash(this.verifyingAddress, this.message),
      ).to.equal(toDataWithIntendedValidatorHash(this.verifyingAddress, this.message));
    });
  });

  context('toTypedDataHash', function () {
    it('returns the digest correctly', async function () {
      const domain = {
        name: 'Test',
        version: 1,
        chainId: 1,
        verifyingContract: this.verifyingAddress,
      };
      const structhash = web3.utils.randomHex(32);
      const expectedDomainSeparator = await domainSeparator(domain);
      expect(await this.messageHashUtils.$toTypedDataHash(expectedDomainSeparator, structhash)).to.equal(
        hashTypedData(domain, structhash),
      );
    });
  });
});
