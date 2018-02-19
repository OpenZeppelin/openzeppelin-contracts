import expectThrow from '../helpers/expectThrow';
import expectEvent from '../helpers/expectEvent';

const WhitelistMock = artifacts.require('WhitelistMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Whitelist', function (accounts) {
  let mock;

  const [
    owner,
    whitelistedAddress1,
    whitelistedAddress2,
    anyone,
  ] = accounts;

  const whitelistedAddresses = [whitelistedAddress1, whitelistedAddress2];

  before(async function () {
    mock = await WhitelistMock.new();
  });

  context('in normal conditions', () => {
    it('should add address to the whitelist', async function () {
      await expectEvent.inTransaction(
        mock.addAddressToWhitelist(whitelistedAddress1, { from: owner }),
        'WhitelistedAddressAdded'
      );
      const isWhitelisted = await mock.whitelist(whitelistedAddress1);
      isWhitelisted.should.be.equal(true);
    });

    it('should add addresses to the whitelist', async function () {
      await expectEvent.inTransaction(
        mock.addAddressesToWhitelist(whitelistedAddresses, { from: owner }),
        'WhitelistedAddressAdded'
      );
      for (let addr of whitelistedAddresses) {
        const isWhitelisted = await mock.whitelist(addr);
        isWhitelisted.should.be.equal(true);
      }
    });

    it('should not announce WhitelistedAddressAdded event if address is already in the whitelist', async function () {
      const { logs } = await mock.addAddressToWhitelist(whitelistedAddress1, { from: owner });
      logs.should.be.empty;
    });

    it('should remove address from the whitelist', async function () {
      await expectEvent.inTransaction(
        mock.removeAddressFromWhitelist(whitelistedAddress1, { from: owner }),
        'WhitelistedAddressRemoved'
      );
      let isWhitelisted = await mock.whitelist(whitelistedAddress1);
      isWhitelisted.should.be.equal(false);
    });

    it('should remove addresses from the the whitelist', async function () {
      await expectEvent.inTransaction(
        mock.removeAddressesFromWhitelist(whitelistedAddresses, { from: owner }),
        'WhitelistedAddressRemoved'
      );
      for (let addr of whitelistedAddresses) {
        const isWhitelisted = await mock.whitelist(addr);
        isWhitelisted.should.be.equal(false);
      }
    });

    it('should not announce WhitelistedAddressRemoved event if address is not in the whitelist', async function () {
      const { logs } = await mock.removeAddressFromWhitelist(whitelistedAddress1, { from: owner });
      logs.should.be.empty;
    });
    
    it('should allow whitelisted address to call #onlyWhitelistedCanDoThis', async () => {
      await mock.addAddressToWhitelist(whitelistedAddress1, { from: owner });
      await mock.onlyWhitelistedCanDoThis({ from: whitelistedAddress1 })
        .should.be.fulfilled;
    });
  });

  context('in adversarial conditions', () => {
    it('should not allow "anyone" to add to the whitelist', async () => {
      await expectThrow(
        mock.addAddressToWhitelist(whitelistedAddress1, { from: anyone })
      );
    });
    
    it('should not allow "anyone" to remove from the whitelist', async () => {
      await expectThrow(
        mock.removeAddressFromWhitelist(whitelistedAddress1, { from: anyone })
      );
    });
    
    it('should not allow "anyone" to call #onlyWhitelistedCanDoThis', async () => {
      await expectThrow(
        mock.onlyWhitelistedCanDoThis({ from: anyone })
      );
    });
  });
});
