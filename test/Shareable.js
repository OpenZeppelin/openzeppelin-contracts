var ShareableMock = artifacts.require("./helpers/ShareableMock.sol");

contract('Shareable', function(accounts) {

  it('should construct with correct owners and number of sigs required', async function() {
    let requiredSigs = 2;
    let owners = accounts.slice(1,4);
    let shareable = await ShareableMock.new(owners, requiredSigs);

    let required = await shareable.required();
    assert.equal(required, requiredSigs);
    let owner = await shareable.getOwner(0);
    assert.equal(owner, accounts[0]);

    for(let i = 0; i < accounts.length; i++) {
      let owner = await shareable.getOwner(i);
      let isowner = await shareable.isOwner(accounts[i]);
      if(i <= owners.length) {
        assert.equal(accounts[i], owner);
        assert.isTrue(isowner);
      } else {
        assert.notEqual(accounts[i], owner);
        assert.isFalse(isowner);
      }
    }
  });

  it('should only perform multisig function with enough sigs', async function() {
    let requiredSigs = 3;
    let owners = accounts.slice(1,4);
    let shareable = await ShareableMock.new(owners, requiredSigs);
    let hash = 1234;

    let initCount = await shareable.count();
    initCount = initCount.toString();

    for(let i = 0; i < requiredSigs; i++) {
      await shareable.increaseCount(hash, {from: accounts[i]});
      let count = await shareable.count();
      if(i == requiredSigs - 1) {
        assert.equal(Number(initCount)+1, count.toString());
      } else {
        assert.equal(initCount, count.toString());
      }
    }
  });

  it('should require approval from different owners', async function() {
    let requiredSigs = 2;
    let owners = accounts.slice(1,4);
    let shareable = await ShareableMock.new(owners, requiredSigs);
    let hash = 1234;

    let initCount = await shareable.count();
    initCount = initCount.toString();

    //Count shouldn't increase when the same owner calls repeatedly
    for(let i = 0; i < 2; i++) {
      await shareable.increaseCount(hash);
      let count = await shareable.count();
      assert.equal(initCount, count.toString());
    }
  });

  it('should reset sig count after operation is approved', async function() {
    let requiredSigs = 3;
    let owners = accounts.slice(1,4);
    let shareable = await ShareableMock.new(owners, requiredSigs);
    let hash = 1234;

    let initCount = await shareable.count();

    for(let i = 0; i < requiredSigs * 3; i++) {
      await shareable.increaseCount(hash, {from: accounts[i % 4]});
      let count = await shareable.count();
      if((i%(requiredSigs)) == requiredSigs - 1) {
        initCount = Number(initCount)+1;
        assert.equal(initCount, count);
      } else {
        assert.equal(initCount.toString(), count);
      }
    }
  });

  it('should not perform multisig function after an owner revokes', async function() {
    let requiredSigs = 3;
    let owners = accounts.slice(1,4);
    let shareable = await ShareableMock.new(owners, requiredSigs);
    let hash = 1234;

    let initCount = await shareable.count();

    for(let i = 0; i < requiredSigs; i++) {
      if(i == 1) {
        await shareable.revoke(hash, {from: accounts[i-1]});
      }
      await shareable.increaseCount(hash, {from: accounts[i]});
      let count = await shareable.count();
      assert.equal(initCount.toString(), count);
    }
  });

});
