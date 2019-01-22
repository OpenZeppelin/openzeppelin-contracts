require('openzeppelin-test-helpers');

const ERC20WithMetadataMock = artifacts.require('ERC20WithMetadataMock');

const metadataURI = 'https://example.com';

describe('ERC20WithMetadata', function () {
  beforeEach(async function () {
    this.token = await ERC20WithMetadataMock.new(metadataURI);
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
