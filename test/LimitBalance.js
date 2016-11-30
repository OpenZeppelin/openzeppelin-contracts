contract('LimitBalance', function(accounts) {
  let lb;

  beforeEach(async function(done) {
    lb = await LimitBalanceMock.new();
    done();
  });

  let LIMIT = 1000;

  it("should expose limit", async function(done) {
    let limit = await lb.limit();
    assert.equal(limit, LIMIT);
    done();
  });

  it("should allow sending below limit", async function(done) {
    let amount = 1;
    let limDeposit = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount);
    done();
  });

  it("shouldnt allow sending above limit", async function(done) {

    let amount = 1110;
    try {
      let limDeposit = await lb.limitedDeposit({value: amount});
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

  it("should allow multiple sends below limit", async function(done) {
    let amount = 500;

    let limDeposit = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount);
    let limDeposit2 = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount*2);
    done();
  });

  it("shouldnt allow multiple sends above limit", async function(done) {
    let amount = 500;

    let limDeposit = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount);
    try {
      await lb.limitedDeposit({value: amount+1})
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

});
