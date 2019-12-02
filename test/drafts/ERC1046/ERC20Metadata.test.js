const { contract } = require('@openzeppelin/test-environment');
require('@openzeppelin/test-helpers');

const ERC20MetadataMock = contract.fromArtifact('ERC20MetadataMock');

const { expect } = require('chai');

const metadataURI = 'https://example.com';

describe('ERC20Metadata', function () {
  beforeEach(async function () {
    this.token = await ERC20MetadataMock.new(metadataURI);
  });

  it('responds with the metadata', async function () {
    expect(await this.token.tokenURI()).to.equal(metadataURI);
  });

  describe('setTokenURI', function () {
    it('changes the original URI', async function () {
      const newMetadataURI = 'https://betterexample.com';
      await this.token.setTokenURI(newMetadataURI);
      expect(await this.token.tokenURI()).to.equal(newMetadataURI);
    });
  });
});
