contract('Ownable', function(accounts) {
  let ownable;

  beforeEach(async function(done) {
    ownable = await Ownable.new();
    done();
  });

  it("should have an owner", async function(done) {
    let owner = await ownable.owner();
    assert.isTrue(owner != 0);
    done();
  });

  it("changes owner after transfer", async function(done) {
    let other = accounts[1];
    let transfer = await ownable.transfer(other);
    let owner = await ownable.owner();
    assert.isTrue(owner === other);
    done();
  });

  it("should prevent non-owners from transfering", async function(done) {
    let other = accounts[2];
    let transfer = await ownable.transfer(other, {from: accounts[2]});
    let owner = await ownable.owner();
     assert.isFalse(owner === other);
     done();
  });

  it("should guard ownership against stuck state", async function(done) {
    let ownable = Ownable.deployed();
    let originalOwner = await ownable.owner();
    let transfer = await ownable.transfer(null, {from: originalOwner});
    let newOwner = await ownable.owner();
    assert.equal(originalOwner, newOwner);
    done();
  });

});
