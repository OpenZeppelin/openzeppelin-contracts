const { ethers } = require('hardhat');
const { expect } = require('chai');
const { hashTypedData, domainSeparator, hashTypedDataEnvelopeStruct, getDomain } = require('../../helpers/eip712');

function shouldBehaveLikeERC1271TypedSigner() {
  const MAGIC_VALUE = '0x1626ba7e';

  beforeEach(async function () {
    this.domain = await getDomain(this.signer.mock);
  });

  describe('isValidSignature', function () {
    it('returns true for a valid personal signature', async function () {
      const contents = ethers.randomBytes(32);
      const personalSignStructHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32'],
        [
          ethers.solidityPackedKeccak256(['string'], ['PersonalSign(bytes prefixed)']),
          ethers.solidityPackedKeccak256(['string', 'bytes32'], ['\x19Ethereum Signed Message:\n32', contents]),
        ],
      );
      const signature = await this.signer.signRaw(hashTypedData(this.domain, personalSignStructHash));

      expect(await this.signer.mock.isValidSignature(contents, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns true for a valid typed data signature', async function () {
      const contents = ethers.randomBytes(32);
      const contentsTypeName = 'SomeType';
      const contentsType = `${contentsTypeName}(address foo,uint256 bar)`;
      const typedDataEnvelopeStructHash = hashTypedDataEnvelopeStruct(
        this.domain,
        contents,
        contentsTypeName,
        contentsType,
      );
      const appDomain = {
        name: 'SomeApp',
        version: '1',
        chainId: this.domain.chainId,
        verifyingContract: ethers.Wallet.createRandom().address,
      };
      const hash = hashTypedData(appDomain, typedDataEnvelopeStructHash);
      expect(
        await this.signer.mock.isValidSignature(
          hash,
          ethers.concat([
            await this.signer.signRaw(hash),
            domainSeparator(appDomain),
            contents,
            ethers.toUtf8Bytes(contentsType),
            ethers.toBeHex(ethers.dataLength(ethers.toUtf8Bytes(contentsType)), 2),
          ]),
        ),
      ).to.equal(MAGIC_VALUE);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC1271TypedSigner,
};
