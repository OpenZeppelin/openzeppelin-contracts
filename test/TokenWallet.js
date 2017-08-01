const assertJump = require('./helpers/assertJump');

var TokenWallet = artifacts.require("../contracts/token/TokenWallet.sol")
var BasicTokenMock = artifacts.require("./helpers/BasicTokenMock.sol");

contract('TokenWallet', function(accounts) {
  let token;
  let tokenWallet;
  let owner;

  beforeEach(async () => {
      token = await BasicTokenMock.new(accounts[0], 100);
      tokenWallet = await TokenWallet();
      owner = await tokenWallet.owner();

      await token.transfer(tokenWallet, 10 , {from: owner});
  });

  it("should be able to register tokens", async function() {
    let tokenAddress = await token.address;
    await tokenWallet.registerToken(tokenAddress, "BasicToken", {from: owner});
    let tkAddr = await tokenWallet.tokens["BasicToken"];
    assert.isEqual(tkAddr, tokenAddress);
  })

  it("should check balance correctly by address", async function(){
    let tokenAddress = await token.addres;
    let balance = await tokenWallet.checkBalance(tokenAddress);
    assert.equal(balance, 10);
  });

  // it("should throw an error when trying to transfer more than balance", async function() {
  //   let token = await BasicTokenMock.new(accounts[0], 100);
  //   try {
  //     let transfer = await token.transfer(accounts[1], 101);
  //     assert.fail('should have thrown before');
  //   } catch(error) {
  //     assertJump(error);
  //   }
  // });

});
