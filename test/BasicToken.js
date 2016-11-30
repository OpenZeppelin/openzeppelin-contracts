contract('BasicToken', function(accounts) {

  it("should return the correct totalSupply after construction", async function(done) {
    let token = await BasicTokenMock.new(accounts[0], 100);
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
    done();
  })

  it("should return correct balances after transfer", async function(done){
    let token = await BasicTokenMock.new(accounts[0], 100);
    let transfer = await token.transfer(accounts[1], 100);
    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 0);
    let secondAccountBalance = await token.balanceOf(accounts[1]);
    assert.equal(secondAccountBalance, 100);
    done();
  });

  it("should throw an error when trying to transfer more than balance", async function(done) {

    let token = await BasicTokenMock.new(accounts[0], 100);
    try {
      let transfer = await token.transfer(accounts[1], 101);
    } catch(error) {
      if (error.message.search('invalid JUMP') === -1) throw error
      assert.isAbove(error.message.search('invalid JUMP'), -1, 'Invalid JUMP error must be returned');
      done();
    }
  });

});
