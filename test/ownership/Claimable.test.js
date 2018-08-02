const { assertRevert } = require('../helpers/assertRevert');

const Claimable = artifacts.require('Claimable');

contract('Claimable', function ([_, owner, newOwner, anyone]) {
  let claimable;

  beforeEach(async function () {
    claimable = await Claimable.new();
  });

  it('changes pendingOwner after transfer', async function () {
    await claimable.transferOwnership(newOwner);
    const pendingOwner = await claimable.pendingOwner();

    assert.isTrue(pendingOwner === newOwner);
  });

  it('should prevent to claimOwnership from anyone', async function () {
    await assertRevert(claimable.claimOwnership({ from: anyone }));
  });

  it('should prevent non-owners from transfering', async function () {
    await assertRevert(claimable.transferOwnership(anyone, { from: anyone }));
  });

  describe('after initiating a transfer', function () {
    beforeEach(async function () {
      await claimable.transferOwnership(newOwner);
    });

    it('changes allow pending owner to claim ownership', async function () {
      await claimable.claimOwnership({ from: newOwner });
      assert.isTrue((await claimable.owner()) === newOwner);
    });
  });
});
