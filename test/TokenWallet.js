const assertJump = require('./helpers/assertJump');

var TokenWallet = artifacts.require("../contracts/token/TokenWallet.sol")
var BasicTokenMock = artifacts.require("./helpers/BasicTokenMock.sol");

contract('TokenWallet', function(accounts) {
  var token;
  var tokenWallet;

  beforeEach(async () => {
      token = await BasicTokenMock.new(accounts[1], 100);
      tokenWallet = await TokenWallet.new({from: accounts[0]});

      await token.transfer(tokenWallet.address, 10 , {from: accounts[1]});
  });


  it("should check balance correctly by address", async function(){
    let balance = await tokenWallet.checkBalance(token.address);
    assert.equal(balance.toNumber(), 10);
  });

  it("should transfer owned tokens correctly", async () => {
    await tokenWallet.transferToken(token.address, accounts[2], 5, {from: accounts[0]})
    assert.equal(await token.balanceOf(tokenWallet.address), 5)
    assert.equal(await token.balanceOf(accounts[2]), 5)
  })
});
