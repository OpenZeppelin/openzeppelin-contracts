const { assertRevert } = require('../helpers/assertRevert');

const SecondaryMock = artifacts.require('SecondaryMock');

require('chai')
  .should();

contract('Secondary', function ([_, primary, newPrimary, anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
      await assertRevert(this.secondary.onlyPrimaryMock({ from: anyone }));
    });
  });

  describe('transferPrimary', function () {
    it('makes the recipient the new primary', async function () {
      await this.secondary.transferPrimary(newPrimary, { from: primary });
      (await this.secondary.primary()).should.equal(newPrimary);
    });

    it('reverts when transfering to the null address', async function () {
      await assertRevert(this.secondary.transferPrimary(ZERO_ADDRESS, { from: primary }));
    });

    it('reverts when called by anyone', async function () {
      await assertRevert(this.secondary.transferPrimary(newPrimary, { from: anyone }));
    });

    context('with new primary', function () {
      beforeEach(async function () {
        await this.secondary.transferPrimary(newPrimary, { from: primary });
      });

      it('allows the new primary account to call onlyPrimary functions', async function () {
        await this.secondary.onlyPrimaryMock({ from: newPrimary });
      });

      it('reverts when the old primary account calls onlyPrimary functions', async function () {
        await assertRevert(this.secondary.onlyPrimaryMock({ from: primary }));
      });
    });
  });
});
