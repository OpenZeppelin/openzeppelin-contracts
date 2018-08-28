const { assertRevert } = require('../helpers/assertRevert');

const SecondaryMock = artifacts.require('SecondaryMock');

require('chai')
  .should();

contract('Secondary', function ([_, primary, anyone]) {
  beforeEach(async function () {
    this.secondary = await SecondaryMock.new({ from: primary });
  });

  it('stores the primary\'s address', async function () {
    (await this.secondary.primary()).should.eq(primary);
  });

  it('allows the primary to call primary-only functions', async function () {
    await this.secondary.onlyPrimaryMock({ from: primary });
  });

  it('reverts when anyone calls primary-only functions', async function () {
    await assertRevert(this.secondary.onlyPrimaryMock({ from: anyone }));
  });
});
