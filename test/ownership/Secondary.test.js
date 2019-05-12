const { constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const SecondaryMock = artifacts.require('SecondaryMock');

contract('Secondary', function ([_, primary, newPrimary, other]) {
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
      await shouldFail.reverting.withMessage(this.secondary.onlyPrimaryMock({ from: other }),
        'Secondary: caller is not the primary account'
      );
    });
  });

  describe('transferPrimary', function () {
    it('makes the recipient the new primary', async function () {
      const { logs } = await this.secondary.transferPrimary(newPrimary, { from: primary });
      expectEvent.inLogs(logs, 'PrimaryTransferred', { recipient: newPrimary });
      (await this.secondary.primary()).should.equal(newPrimary);
    });

    it('reverts when transferring to the null address', async function () {
      await shouldFail.reverting.withMessage(this.secondary.transferPrimary(ZERO_ADDRESS, { from: primary }),
        'Secondary: new primary is the zero address'
      );
    });

    it('reverts when called by anyone', async function () {
      await shouldFail.reverting.withMessage(this.secondary.transferPrimary(newPrimary, { from: other }),
        'Secondary: caller is not the primary account'
      );
    });

    context('with new primary', function () {
      beforeEach(async function () {
        await this.secondary.transferPrimary(newPrimary, { from: primary });
      });

      it('allows the new primary account to call onlyPrimary functions', async function () {
        await this.secondary.onlyPrimaryMock({ from: newPrimary });
      });

      it('reverts when the old primary account calls onlyPrimary functions', async function () {
        await shouldFail.reverting.withMessage(this.secondary.onlyPrimaryMock({ from: primary }),
          'Secondary: caller is not the primary account'
        );
      });
    });
  });
});
