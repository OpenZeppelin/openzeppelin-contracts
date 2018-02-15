import expectThrow from '../helpers/expectThrow';

const WhitelistMock = artifacts.require('WhitelistMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Whitelist', function (accounts) {
  let mock;

  const [
    owner,
    whitelisted,
    anyone,
  ] = accounts;

  before(async function () {
    mock = await WhitelistMock.new();
  });

  context('in normal conditions', () => {
    it('should add to whitelist', async function () {
      await mock.addToWhitelist(whitelisted, { from: owner });
      const isWhitelisted = await mock.whitelist(whitelisted);
      isWhitelisted.should.be.equal(true);
    });

    it('should remove from whitelist', async function () {
      await mock.removeFromWhitelist(whitelisted, { from: owner });
      let isWhitelisted = await mock.whitelist(whitelisted);
      isWhitelisted.should.be.equal(false);
    });
    
    it('should allow whitelisted to call #onlyWhitelistedCanDoThis', async () => {
      await mock.addToWhitelist(whitelisted, { from: owner });
      await mock.onlyWhitelistedCanDoThis({ from: whitelisted })
        .should.be.fulfilled;
    });
  });

  context('in adversarial conditions', () => {
    it('should not allow "anyone" to add to whitelist', async () => {
      await expectThrow(
        mock.addToWhitelist(whitelisted, { from: anyone })
      );
    });
    
    it('should not allow "anyone" to remove from whitelist', async () => {
      await expectThrow(
        mock.removeFromWhitelist(whitelisted, { from: anyone })
      );
    });
    
    it('should not allow "anyone" to call #onlyWhitelistedCanDoThis', async () => {
      await expectThrow(
        mock.onlyWhitelistedCanDoThis({ from: anyone })
      );
    });
  });
});
