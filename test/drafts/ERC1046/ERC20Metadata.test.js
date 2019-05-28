require('openzeppelin-test-helpers');

const ERC20MetadataMock = artifacts.require('ERC20MetadataMock');

const metadataURI = 'https://example.com';

describe('ERC20Metadata', function () {
  beforeEach(async function () {
    this.token = await ERC20MetadataMock.new(metadataURI);
  });

  it('responds with the metadata', async function () {
    (await this.token.tokenURI()).should.equal(metadataURI);
  });

  describe('setTokenURI', function () {
    it('changes the original URI', async function () {
      const newMetadataURI = 'https://betterexample.com';
      await this.token.setTokenURI(newMetadataURI);
      (await this.token.tokenURI()).should.equal(newMetadataURI);
    });
  });
});
