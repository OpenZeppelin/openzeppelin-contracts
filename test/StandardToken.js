contract('StandardToken', function(accounts) {

  it("should return the correct totalSupply after construction", async function(done) {
    let token = await StandardTokenMock.new(accounts[0], 100);
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
    done();
  })

  it("should return the correct allowance amount after approval", async function(done) {
    let token = await StandardTokenMock.new();
    let approve = await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);
    assert.equal(allowance, 100);
    done();
  });

  it("should return correct balances after transfer", async function(done) {
    let token = await StandardTokenMock.new(accounts[0], 100);
    let transfer = await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
    done();
  });

  it("should throw an error when trying to transfer more than balance", async function(done) {
    let token = await StandardTokenMock.new(accounts[0], 100);
    try {
      let transfer = await token.transfer(accounts[1], 101);
    } catch(error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

  it("should return correct balances after transfering from another account", async function(done) {
    let token = await StandardTokenMock.new(accounts[0], 100);
    let approve = await token.approve(accounts[1], 100);
    let transferFrom = await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
    done();
  });

  it("should throw an error when trying to transfer more than allowed", async function(done) {
    let token = await StandardTokenMock.new();
    let approve = await token.approve(accounts[1], 99);
    try {
      let transfer = await token.transferFrom(accounts[0], accounts[2], 100, {from: accounts[1]});
    } catch (error) {
      if (error.message.search('invalid JUMP') == -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

});
