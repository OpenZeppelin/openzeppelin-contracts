'use strict';

let sendReward = function(sender, receiver, value){
  web3.eth.sendTransaction({
    from:sender,
    to:receiver,
    value: value
  });
};
var SecureTargetBounty = artifacts.require('helpers/SecureTargetBounty.sol');
var InsecureTargetBounty = artifacts.require('helpers/InsecureTargetBounty.sol');

function awaitEvent(event, handler) {
  return new Promise((resolve, reject) => {
    function wrappedHandler(...args) {
      Promise.resolve(handler(...args)).then(resolve).catch(reject);
    }
  
    event.watch(wrappedHandler);
  });
}

contract('Bounty', function(accounts) {

  it('sets reward', async function() {
    let owner = accounts[0];
    let reward = web3.toWei(1, 'ether');
    let bounty = await SecureTargetBounty.new();
    sendReward(owner, bounty.address, reward);

    assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber());
  });

  it('empties itself when destroyed', async function(){
    let owner = accounts[0];
    let reward = web3.toWei(1, 'ether');
    let bounty = await SecureTargetBounty.new();
    sendReward(owner, bounty.address, reward);

    assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber());

    await bounty.destroy();
    assert.equal(0, web3.eth.getBalance(bounty.address).toNumber());
  });

  describe('Against secure contract', function(){

    it('cannot claim reward', async function(){
      let owner = accounts[0];
      let researcher = accounts[1];
      let reward = web3.toWei(1, 'ether');
      let bounty = await SecureTargetBounty.new();
      let event = bounty.TargetCreated({});

      let watcher = async function(err, result) {
        event.stopWatching();
        if (err) { throw err; }

        var targetAddress = result.args.createdAddress;
        sendReward(owner, bounty.address, reward);

        assert.equal(reward,
          web3.eth.getBalance(bounty.address).toNumber());

        try {
          await bounty.claim(targetAddress, {from:researcher});
          assert.isTrue(false); // should never reach here
        } catch(error) {
          let reClaimedBounty = await bounty.claimed.call();
          assert.isFalse(reClaimedBounty);

        }
        try {
          await bounty.withdrawPayments({from:researcher});
          assert.isTrue(false); // should never reach here
        } catch (err) {
          assert.equal(reward,
            web3.eth.getBalance(bounty.address).toNumber());
        }
      };
      bounty.createTarget({from:researcher});
      await awaitEvent(event, watcher);
    });
  });

  describe('Against broken contract', function(){
    it('claims reward', async function() {
      let owner = accounts[0];
      let researcher = accounts[1];
      let reward = web3.toWei(1, 'ether');
      let bounty = await InsecureTargetBounty.new();
      let event = bounty.TargetCreated({});
      
      let watcher = async function(err, result) {
        event.stopWatching();
        if (err) { throw err; }
        let targetAddress = result.args.createdAddress;
        sendReward(owner, bounty.address, reward);

        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber());

        await bounty.claim(targetAddress, {from:researcher});
        let claim = await bounty.claimed.call();

        assert.isTrue(claim);

        await bounty.withdrawPayments({from:researcher});

        assert.equal(0, web3.eth.getBalance(bounty.address).toNumber());
      };
      bounty.createTarget({from:researcher});
      await awaitEvent(event, watcher);
    });
  });
});
