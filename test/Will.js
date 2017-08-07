const assertJump = require('./helpers/assertJump');
const timer = require('./helpers/timer');
var Will = artifacts.require("../contracts/ownership/Will.sol");

contract('Will', function(accounts) {
  let will;
  let owner;
  let address;

  beforeEach(async function() {
    will = await Will.new();
    owner = await will.owner();
    address = await will.address;
  });

  describe("should ping correctly", async () => {
    let lastPing = 0;
    it("should ping on creation", function() {
      return will.getLastPingTime().then(function (ping){
        assert.isTrue(ping > 0);
        lastPing = ping;
      })
    });

    it("Should ping on 'onlyOwner' modifier", async ()=> {
      will.ping({from: owner})
      await timer(10);
      let newPing = await will.getLastPingTime();
      assert.isTrue(newPing > lastPing);
      lastPing = newPing;
    });
  });

  it("should be able to change ping interval", async () => {
    let initialInterval = await will.maxPingInterval();
    will.changeMaxPingInterval(1, {from: owner});
    let newInt = 86400 //seconds in a day
    let newInterval = await will.maxPingInterval();
    assert.isTrue(newInterval == 86400);
  });

  it("should be able to receive ether", async function(){
    let startBalance = await web3.eth.getBalance(address).toNumber();
    await will.deposit.sendTransaction({
      from: owner,
      to: address,
      value: web3.toWei('5', 'ether')
    });
    let finishBalance = await web3.eth.getBalance(address).toNumber();
    assert.isTrue(startBalance < finishBalance);
  });

  it("should be able to add heir", async () => {
    let initialHeirCount = await will.getHeirCount();
    await will.addHeir(accounts[2], {from: owner});
    let newCount = await will.getHeirCount();
    assert.equal(newCount, 1);
  })

  it("shouldn't be claimable if it is within ping timeframe", async () => {
    try{
      await will.claimHeirtage();
    }catch(err){
      return assertJump(err);
    }
  })

  it("should tranfer funds among heirs when claimable", async () => {
    await will.deposit.sendTransaction({
      from: owner,
      to: address,
      value: web3.toWei('5', 'ether')
    });
    let willInitialBalance = await web3.eth.getBalance(address).toNumber();
    let heirOneInitialBalance = await web3.eth.getBalance(accounts[2]).toNumber();
    let heirTwoInitialBalance = await web3.eth.getBalance(accounts[3]).toNumber();
    await will.addHeir(accounts[2], {from: owner});
    await will.addHeir(accounts[3], {from: owner});
    await timer(259200); //wait for ping expiration
    await will.claimHeirtage({from: accounts[5]});
    let willFinalBalance = await web3.eth.getBalance(address).toNumber();
    let heirOneFinalBalance = await web3.eth.getBalance(accounts[2]).toNumber();
    let heirTwoFinalBalance = await web3.eth.getBalance(accounts[3]).toNumber();
    let gains = (heirOneFinalBalance - heirOneInitialBalance) + (heirTwoFinalBalance - heirTwoInitialBalance)
    assert.equal(heirOneFinalBalance, heirTwoFinalBalance);
    assert.isTrue(willFinalBalance == 0);
    assert.equal(gains, willInitialBalance);
  })

});
