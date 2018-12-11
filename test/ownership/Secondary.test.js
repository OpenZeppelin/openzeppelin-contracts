const shouldFail = require('../helpers/shouldFail');
const expectEvent = require('../helpers/expectEvent');
const { ZERO_ADDRESS } = require('../helpers/constants');

const SecondaryMock = artifacts.require('SecondaryMock');

require('../helpers/setup');

contract('Secondary', function ([_, primary, newPrimary, anyone]) {
  beforeEach(async function () {
    this.secondary = await SecondaryMock.new({ from: primary });
  });

  it('stores the primary\'s address', async function () {
    (await this.secondary.primary()).should.equal(primary);
  });

  describe('onlyPrimary', function () {
    it('allows the primary account to call onlyPrimary functions', async function () {
      await this.secondary.onlyPrimaryMock({ from: primary });
    });

    it('reverts when anyone calls onlyPrimary functions', async function () {
      await shouldFail.reverting(this.secondary.onlyPrimaryMock({ from: anyone }));
    });
  });

  describe('transferPrimary', function () {
    it('makes the recipient the new primary', async function () {
      const { logs } = await this.secondary.transferPrimary(newPrimary, { from: primary });
      expectEvent.inLogs(logs, 'PrimaryTransferred', { recipient: newPrimary });
      (await this.secondary.primary()).should.equal(newPrimary);
    });

    it('reverts when transfering to the null address', async function () {
      await shouldFail.reverting(this.secondary.transferPrimary(ZERO_ADDRESS, { from: primary }));
    });

    it('reverts when called by anyone', async function () {
      await shouldFail.reverting(this.secondary.transferPrimary(newPrimary, { from: anyone }));
    });

    context('with new primary', function () {
      beforeEach(async function () {
        await this.secondary.transferPrimary(newPrimary, { from: primary });
      });

      it('allows the new primary account to call onlyPrimary functions', async function () {
        await this.secondary.onlyPrimaryMock({ from: newPrimary });
      });

      it('reverts when the old primary account calls onlyPrimary functions', async function () {
        await shouldFail.reverting(this.secondary.onlyPrimaryMock({ from: primary }));
      });
    });
  });
});
