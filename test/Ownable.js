contract('Ownable', function(accounts) {
  let ownable;

  beforeEach(async function() {
    ownable = await Ownable.new();
  });

  it("should have an owner", async function() {
    let owner = await ownable.owner();
    assert.isTrue(owner != 0);
  });

  it("changes owner after transfer", async function() {
    let other = accounts[1];
    let transfer = await ownable.transferOwnership(other);
    let owner = await ownable.owner();

    assert.isTrue(owner === other);
  });

  it("should prevent non-owners from transfering", async function() {
    let other = accounts[2];
    let transfer = await ownable.transferOwnership(other, {from: accounts[2]});
    let owner = await ownable.owner();

     assert.isFalse(owner === other);
  });

  it("should guard ownership against stuck state", async function() {
    let ownable = Ownable.deployed();
    let originalOwner = await ownable.owner();
    let transfer = await ownable.transferOwnership(null, {from: originalOwner});
    let newOwner = await ownable.owner();

    assert.equal(originalOwner, newOwner);
  });

});
