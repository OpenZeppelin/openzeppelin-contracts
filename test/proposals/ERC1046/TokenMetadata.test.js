import assertRevert from '../../helpers/assertRevert';
const ERC20WithMetadata = artifacts.require('ERC20WithMetadataMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

const metadataURI = 'https://example.com';
const invalidMetadataURI = '';

describe('ERC20WithMetadata', function () {
  context('invalid metadata', function () {
    before(async function () {
      this.token = await ERC20WithMetadata.new(invalidMetadataURI);
    });

    it('throws', async function () {
      await assertRevert(
        this.token.tokenURI()
      );
    });
  });
  context('valid metadata', function () {
    before(async function () {
      this.token = await ERC20WithMetadata.new(metadataURI);
    });

    it('responds with the metadata', async function () {
      const got = await this.token.tokenURI();
      got.should.eq(metadataURI);
    });
  });
});
