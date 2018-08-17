const { expectThrow } = require('../helpers/expectThrow');

const HasNoTokens = artifacts.require('HasNoTokens');
const ERC223TokenMock = artifacts.require('ERC223TokenMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('HasNoTokens', function ([_, owner, initialAccount, anyone]) {
  let hasNoTokens = null;
  let token = null;

  beforeEach(async () => {
    // Create contract and token
    hasNoTokens = await HasNoTokens.new({ from: owner });
    token = await ERC223TokenMock.new(initialAccount, 100);

    // Force token into contract
    await token.transfer(hasNoTokens.address, 10, { from: initialAccount });

    (await token.balanceOf(hasNoTokens.address)).should.be.bignumber.equal(10);
  });

  it('should not accept ERC223 tokens', async function () {
    await expectThrow(token.transferERC223(hasNoTokens.address, 10, '', { from: initialAccount }));
  });

  it('should allow owner to reclaim tokens', async function () {
    const ownerStartBalance = await token.balanceOf(owner);
    await hasNoTokens.reclaimToken(token.address, { from: owner });

    const ownerFinalBalance = await token.balanceOf(owner);
    ownerFinalBalance.sub(ownerStartBalance).should.be.bignumber.equal(10);

    (await token.balanceOf(hasNoTokens.address)).should.be.bignumber.equal(0);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await expectThrow(
      hasNoTokens.reclaimToken(token.address, { from: anyone })
    );
  });
});
