const { expectThrow } = require('../helpers/expectThrow');

const CanReclaimToken = artifacts.require('CanReclaimToken');
const BasicTokenMock = artifacts.require('BasicTokenMock');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CanReclaimToken', function (accounts) {
  let token = null;
  let canReclaimToken = null;

  beforeEach(async function () {
    // Create contract and token
    token = await BasicTokenMock.new(accounts[0], 100);
    canReclaimToken = await CanReclaimToken.new();
    // Force token into contract
    await token.transfer(canReclaimToken.address, 10);
    const startBalance = await token.balanceOf(canReclaimToken.address);
    startBalance.should.be.bignumber.eq(10);
  });

  it('should allow owner to reclaim tokens', async function () {
    const ownerStartBalance = await token.balanceOf(accounts[0]);
    await canReclaimToken.reclaimToken(token.address);
    const ownerFinalBalance = await token.balanceOf(accounts[0]);
    const finalBalance = await token.balanceOf(canReclaimToken.address);
    finalBalance.should.be.bignumber.eq(0);
    ownerFinalBalance.sub(ownerStartBalance).should.be.bignumber.eq(10);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await expectThrow(
      canReclaimToken.reclaimToken(token.address, { from: accounts[1] }),
    );
  });
});
