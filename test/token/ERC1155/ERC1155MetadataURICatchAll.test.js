const { contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const ERC1155Mock = contract.fromArtifact('ERC1155Mock');

describe('ERC1155MetadataURICatchAll', function () {
  const initialURI = 'https://example.com/{id}.json';

  const firstTokenID = new BN('42');
  const secondTokenID = new BN('1337');

  beforeEach(async function () {
    this.token = await ERC1155Mock.new(initialURI);
  });

  it('emits no URI event in constructor', async function () {
    await expectEvent.notEmitted.inConstruction(this.token, 'URI');
  });

  it('sets the initial URI for all token types', async function () {
    expect(await this.token.uri(firstTokenID)).to.be.equal(initialURI);
    expect(await this.token.uri(secondTokenID)).to.be.equal(initialURI);
  });

  describe('_setURI', function () {
    const newURI = 'https://example.com/{locale}/{id}.json';

    it('emits no URI event', async function () {
      const receipt = await this.token.setURI(newURI);

      expectEvent.notEmitted(receipt, 'URI');
    });

    it('sets the new URI for all token types', async function () {
      await this.token.setURI(newURI);

      expect(await this.token.uri(firstTokenID)).to.be.equal(newURI);
      expect(await this.token.uri(secondTokenID)).to.be.equal(newURI);
    });
  });
});
