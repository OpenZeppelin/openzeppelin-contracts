contract('LimitBalance', function(accounts) {
  var lb;

  beforeEach(async function() {
    lb = await LimitBalanceMock.new();
  });

  let LIMIT = 1000;

  it("should expose limit", async function() {
    let limit = await lb.limit();
    assert.equal(limit, LIMIT);
  });

  it("should allow sending below limit", async function() {
    let amount = 1;
    let limDeposit = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount);
  });

  it("shouldnt allow sending above limit", async function() {

    let amount = 1110;
    try {
      let limDeposit = await lb.limitedDeposit({value: amount});
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
    }
  });

  it("should allow multiple sends below limit", async function() {
    let amount = 500;

    let limDeposit = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount);
    let limDeposit2 = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount*2);
  });

  it("shouldnt allow multiple sends above limit", async function() {
    let amount = 500;


    let limDeposit = await lb.limitedDeposit({value: amount});
    assert.equal(web3.eth.getBalance(lb.address), amount);
    try {
      lb.limitedDeposit({value: amount+1})
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
    }
  });

});
