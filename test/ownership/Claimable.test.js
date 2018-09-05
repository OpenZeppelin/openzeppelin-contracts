const { assertRevert } = require('../helpers/assertRevert');

const Claimable = artifacts.require('Claimable');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Claimable', function ([_, owner, newOwner, anyone]) {
  let claimable;

  beforeEach(async function () {
    claimable = await Claimable.new({ from: owner });
  });

  it('should have an owner', async function () {
    (await claimable.owner()).should.not.equal(0);
  });

  it('changes pendingOwner after transfer', async function () {
    await claimable.transferOwnership(newOwner, { from: owner });
    (await claimable.pendingOwner()).should.equal(newOwner);
  });

  it('should prevent to claimOwnership from anyone', async function () {
    await assertRevert(claimable.claimOwnership({ from: anyone }));
  });

  it('should prevent non-owners from transfering', async function () {
    await assertRevert(claimable.transferOwnership(anyone, { from: anyone }));
  });

  describe('after initiating a transfer', function () {
    beforeEach(async function () {
      await claimable.transferOwnership(newOwner, { from: owner });
    });

    it('changes allow pending owner to claim ownership', async function () {
      await claimable.claimOwnership({ from: newOwner });

      (await claimable.owner()).should.equal(newOwner);
    });
  });
});
