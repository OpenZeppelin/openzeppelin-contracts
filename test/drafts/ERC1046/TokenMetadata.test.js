const ERC20WithMetadataMock = artifacts.require('ERC20WithMetadataMock');

require('../../helpers/setup');

const metadataURI = 'https://example.com';

describe('ERC20WithMetadata', function () {
  beforeEach(async function () {
    this.token = await ERC20WithMetadataMock.new(metadataURI);
  });

  it('responds with the metadata', async function () {
    (await this.token.tokenURI()).should.equal(metadataURI);
  });
});
