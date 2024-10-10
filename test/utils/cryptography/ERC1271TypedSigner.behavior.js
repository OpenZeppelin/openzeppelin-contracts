const { ethers } = require('hardhat');
const { expect } = require('chai');
const { hashTypedData, domainSeparator, hashTypedDataEnvelopeStruct, getDomain } = require('../../helpers/eip712');

function shouldBehaveLikeERC1271TypedSigner() {
  const MAGIC_VALUE = '0x1626ba7e';

  beforeEach(async function () {
    this.domain = await getDomain(this.mock);
  });

  describe('isValidSignature', function () {
    it('returns true for a valid personal signature', async function () {
      const contents = ethers.randomBytes(32);
      const signature = await this.signer.signPersonal(this.domain, contents);
      expect(await this.mock.isValidSignature(contents, signature)).to.equal(MAGIC_VALUE);
    });

    it('returns true for a valid typed data signature', async function () {
      const contents = ethers.randomBytes(32);
      const contentsType = 'SomeType(address foo,uint256 bar)';
      const appDomain = {
        name: 'SomeApp',
        version: '1',
        chainId: this.domain.chainId,
        verifyingContract: ethers.Wallet.createRandom().address,
      };
      expect(
        await this.mock.isValidSignature(
          hashTypedData(appDomain, hashTypedDataEnvelopeStruct(this.domain, contents, contentsType)),
          ethers.concat([
            await this.signer.signTypedDataEnvelope(this.domain, appDomain, contents, contentsType),
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
