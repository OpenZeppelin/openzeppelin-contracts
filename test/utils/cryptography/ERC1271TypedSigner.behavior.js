const { ethers } = require('hardhat');
const { expect } = require('chai');
const { hashTypedDataEnvelope, hashTypedData, domainSeparator } = require('../../helpers/eip712');

function shouldBehaveLikeERC1271TypedSigner() {
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
      const signature = await this.signRaw(hashTypedData(this.domain, personalSignStructHash));

      expect(await this.mock.isValidSignature(contents, signature)).to.equal('0x1626ba7e');
    });

    it('returns true for a valid typed data signature', async function () {
      const contents = ethers.randomBytes(32);
      const contentsTypeName = 'SomeType';
      const contentsType = ethers.toUtf8Bytes(`${contentsTypeName}(address foo,uint256 bar)`);
      const typedDataEnvelopeTypeHash = hashTypedDataEnvelope(contentsTypeName, contentsType);
      const typedDataEnvelopeStructHash = ethers.solidityPackedKeccak256(
        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint256', 'address', 'bytes32', 'bytes32'],
        [
          typedDataEnvelopeTypeHash,
          contents,
          ethers.solidityPackedKeccak256(['string'], [this.domain.name]),
          ethers.solidityPackedKeccak256(['string'], [this.domain.version]),
          this.domain.chainId,
          this.domain.verifyingContract,
          ethers.ZeroHash,
          ethers.keccak256('0x'), // extensions = []
        ],
      );
      const appDomain = {
        name: 'SomeApp',
        version: '1',
        chainId: this.domain.chainId,
        verifyingContract: ethers.Wallet.createRandom().address,
      };
      const hash = hashTypedData(appDomain, typedDataEnvelopeStructHash);
      expect(
        await this.mock.isValidSignature(
          hash,
          ethers.concat([
            await this.signRaw(hash),
            domainSeparator(appDomain),
            contents,
            contentsType,
            ethers.toBeHex(ethers.dataLength(contentsType), 2),
          ]),
        ),
      ).to.equal(true);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC1271TypedSigner,
};
