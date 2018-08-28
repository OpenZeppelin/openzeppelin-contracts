const { expectThrow } = require('../helpers/expectThrow');

const CanReclaimToken = artifacts.require('CanReclaimToken');
const StandardTokenMock = artifacts.require('StandardTokenMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CanReclaimToken', function ([_, owner, anyone]) {
  let token = null;
  let canReclaimToken = null;

  beforeEach(async function () {
    // Create contract and token
    token = await StandardTokenMock.new(owner, 100, { from: owner });
    canReclaimToken = await CanReclaimToken.new({ from: owner });

    // Force token into contract
    await token.transfer(canReclaimToken.address, 10, { from: owner });
    (await token.balanceOf(canReclaimToken.address)).should.be.bignumber.equal(10);
  });

  it('should allow owner to reclaim tokens', async function () {
    const ownerStartBalance = await token.balanceOf(owner);
    await canReclaimToken.reclaimToken(token.address, { from: owner });
    const ownerFinalBalance = await token.balanceOf(owner);
    ownerFinalBalance.sub(ownerStartBalance).should.be.bignumber.equal(10);

    (await token.balanceOf(canReclaimToken.address)).should.be.bignumber.equal(0);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await expectThrow(
      canReclaimToken.reclaimToken(token.address, { from: anyone })
    );
  });
});
