contract('Claimable', function(accounts) {
  let claimable;

  beforeEach(async function(done) {
    claimable = await Claimable.new();
    done();
  });

  it("should have an owner", async function(done) {
    let owner = await claimable.owner();
    assert.isTrue(owner != 0);
    done();
  });

  it("changes pendingOwner after transfer", async function(done) {
    let newOwner = accounts[1];
    let transfer = await claimable.transfer(newOwner);
    let pendingOwner = await claimable.pendingOwner();
    assert.isTrue(pendingOwner === newOwner);
    done();
  });

  it("should prevent to claimOwnership from no pendingOwner", async function(done) {
    let claimedOwner = await claimable.claimOwnership({from: accounts[2]});
    let owner = await claimable.owner();
    assert.isTrue(owner != accounts[2]);
    done();
  });

  it("should prevent non-owners from transfering", async function(done) {
    let transfer = await claimable.transfer(accounts[2], {from: accounts[2]});
    let pendingOwner = await claimable.pendingOwner();
    assert.isFalse(pendingOwner === accounts[2]);
    done();
  });

  describe("after initiating a transfer", function () {
    let newOwner;

    beforeEach(async function (done) {
      newOwner = accounts[1];
      await claimable.transfer(newOwner);
      done();
    });

    it("changes allow pending owner to claim ownership", async function(done) {
      let claimedOwner = await claimable.claimOwnership({from: newOwner})
      let owner = await claimable.owner();
      assert.isTrue(owner === newOwner);
      done();
    });
  });
});
