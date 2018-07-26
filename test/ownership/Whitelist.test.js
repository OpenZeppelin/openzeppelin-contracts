const { expectThrow } = require('../helpers/expectThrow');
const expectEvent = require('../helpers/expectEvent');

const WhitelistMock = artifacts.require('WhitelistMock');

require('chai')
  .should();

contract('Whitelist', function (accounts) {
  const [
    owner,
    whitelistedAddress1,
    whitelistedAddress2,
    anyone,
  ] = accounts;

  const whitelistedAddresses = [whitelistedAddress1, whitelistedAddress2];

  beforeEach(async function () {
    this.mock = await WhitelistMock.new();
    this.role = await this.mock.ROLE_WHITELISTED();
  });

  context('in normal conditions', function () {
    it('should add address to the whitelist', async function () {
      await expectEvent.inTransaction(
        this.mock.addAddressToWhitelist(whitelistedAddress1, { from: owner }),
        'RoleAdded',
        { role: this.role },
      );
      const isWhitelisted = await this.mock.whitelist(whitelistedAddress1);
      isWhitelisted.should.be.equal(true);
    });

    it('should add addresses to the whitelist', async function () {
      await expectEvent.inTransaction(
        this.mock.addAddressesToWhitelist(whitelistedAddresses, { from: owner }),
        'RoleAdded',
        { role: this.role },
      );
      for (const addr of whitelistedAddresses) {
        const isWhitelisted = await this.mock.whitelist(addr);
        isWhitelisted.should.be.equal(true);
      }
    });

    it('should remove address from the whitelist', async function () {
      await expectEvent.inTransaction(
        this.mock.removeAddressFromWhitelist(whitelistedAddress1, { from: owner }),
        'RoleRemoved',
        { role: this.role },
      );
      const isWhitelisted = await this.mock.whitelist(whitelistedAddress1);
      isWhitelisted.should.be.equal(false);
    });

    it('should remove addresses from the the whitelist', async function () {
      await expectEvent.inTransaction(
        this.mock.removeAddressesFromWhitelist(whitelistedAddresses, { from: owner }),
        'RoleRemoved',
        { role: this.role },
      );
      for (const addr of whitelistedAddresses) {
        const isWhitelisted = await this.mock.whitelist(addr);
        isWhitelisted.should.be.equal(false);
      }
    });

    it('should allow whitelisted address to call #onlyWhitelistedCanDoThis', async function () {
      await this.mock.addAddressToWhitelist(whitelistedAddress1, { from: owner });
      await this.mock.onlyWhitelistedCanDoThis({ from: whitelistedAddress1 });
    });
  });

  context('in adversarial conditions', function () {
    it('should not allow "anyone" to add to the whitelist', async function () {
      await expectThrow(
        this.mock.addAddressToWhitelist(whitelistedAddress1, { from: anyone })
      );
    });

    it('should not allow "anyone" to remove from the whitelist', async function () {
      await expectThrow(
        this.mock.removeAddressFromWhitelist(whitelistedAddress1, { from: anyone })
      );
    });

    it('should not allow "anyone" to call #onlyWhitelistedCanDoThis', async function () {
      await expectThrow(
        this.mock.onlyWhitelistedCanDoThis({ from: anyone })
      );
    });
  });
});
