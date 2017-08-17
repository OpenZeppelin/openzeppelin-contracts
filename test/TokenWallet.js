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

  it("should be able to register tokens", async () => {
      tokenWallet.registerToken(token.address, "BasicToken", {from: accounts[0]})
      assert.equal(await tokenWallet.tokens("BasicToken"), token.address)
  })

  it("should check balance correctly by address", async function(){
    let balance = await tokenWallet.checkBalance(token.address);
    assert.equal(balance.toNumber(), 10);
  });

  it("should transfer owned tokens correctly", async () => {
    await tokenWallet.transferToken(token.address, accounts[2], 5, {from: accounts[0]})
    assert.equal(await token.balanceOf(tokenWallet.address), 5)
    assert.equal(await token.balanceOf(accounts[2]), 5)
  })

  it("should transfer correctly by token name", async function(){
    const transferByName = (n,t,v,p) => {
        return new Promise((resolve, reject) => {
          tokenWallet.contract.transferToken['bytes32,address,uint256'](n,t,v,p, (err, res) => {
            if(err) return reject(err)
            resolve(res)
          })
        })
    }

    await tokenWallet.registerToken(token.address, "BasicToken", {from: accounts[0]})
    await transferByName("BasicToken", accounts[3], 7, {from:accounts[0]});
    assert.equal(await token.balanceOf(tokenWallet.address), 3)
    assert.equal(await token.balanceOf(accounts[3]), 7)
  });

  it("should check balance correctly by token name", async function(){
    const checkBalanceByName = (n,p) => {
        return new Promise((resolve, reject) => {
          tokenWallet.contract.checkBalance['bytes32'](n, p, (err, res) => {
            if(err || !res) return reject(err)
            resolve(res)
          })
        })
    }
    await tokenWallet.registerToken(token.address, "BasicToken", {from: accounts[0]})
    let balance = await checkBalanceByName("BasicToken", {from:accounts[0]});
    assert.equal(balance.toNumber(), 10);
  });


});
