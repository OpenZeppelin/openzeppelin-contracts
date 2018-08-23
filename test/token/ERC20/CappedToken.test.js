const { assertRevert } = require('../../helpers/assertRevert');
const { ether } = require('../../helpers/ether');
const { shouldBehaveLikeMintableToken } = require('./MintableToken.behavior');
const { shouldBehaveLikeCappedToken } = require('./CappedToken.behavior');

const CappedToken = artifacts.require('CappedToken');

contract('Capped', function ([_, minter, ...otherAccounts]) {
  const cap = ether(1000);

  it('requires a non-zero cap', async function () {
    await assertRevert(
      CappedToken.new(0, [minter])
    );
  });

  context('once deployed', async function () {
    beforeEach(async function () {
      this.token = await CappedToken.new(cap, [minter]);
    });

    shouldBehaveLikeCappedToken(minter, otherAccounts, cap);
    shouldBehaveLikeMintableToken(minter, otherAccounts);
  });
});
