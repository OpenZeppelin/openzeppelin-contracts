contract('Claimable', function(accounts) {
  let claimable;

  beforeEach(async function() {
    claimable = await Claimable.new();
  });

  it("should have an owner", async function() {
    let owner = await claimable.owner();
    assert.isTrue(owner != 0);
  });

  it("changes pendingOwner after transfer", async function() {
    let newOwner = accounts[1];
    let transfer = await claimable.transfer(newOwner);
    let pendingOwner = await claimable.pendingOwner();

    assert.isTrue(pendingOwner === newOwner);
  });

  it("should prevent to claimOwnership from no pendingOwner", async function() {
    let claimedOwner = await claimable.claimOwnership({from: accounts[2]});
    let owner = await claimable.owner();
    
    assert.isTrue(owner != accounts[2]);
  });

  it("should prevent non-owners from transfering", async function() {
    let transfer = await claimable.transfer(accounts[2], {from: accounts[2]});
    let pendingOwner = await claimable.pendingOwner();

    assert.isFalse(pendingOwner === accounts[2]);
  });

  describe("after initiating a transfer", function () {
    let newOwner;

    beforeEach(async function () {
      newOwner = accounts[1];
      await claimable.transfer(newOwner);
    });

    it("changes allow pending owner to claim ownership", async function() {
      let claimedOwner = await claimable.claimOwnership({from: newOwner})
      let owner = await claimable.owner();

      assert.isTrue(owner === newOwner);
    });
  });
});
