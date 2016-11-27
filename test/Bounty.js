let sendReward = function(sender, receiver, value){
  web3.eth.sendTransaction({
    from:sender,
    to:receiver,
    value: value
  })
}

contract('Bounty', function(accounts) {

  it("sets reward", async function(){
    let owner = accounts[0];
    let reward = web3.toWei(1, "ether");

    let bounty = await SecureTargetBounty.new();
    sendReward(owner, bounty.address, reward);
    assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
  })

  it("empties itself when killed", async function(){
    let owner = accounts[0];
    let reward = web3.toWei(1, "ether");

    let bounty = await SecureTargetBounty.new();
    sendReward(owner, bounty.address, reward);
    assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
    await bounty.kill();
    assert.equal(0, web3.eth.getBalance(bounty.address).toNumber())
  })

  describe("Against secure contract", function(){
    it("checkInvariant returns true", async function(){

      let bounty = await SecureTargetBounty.new();
      let target = await bounty.createTarget();
      let check = await bounty.checkInvariant.call();
      assert.isTrue(check);
    })

    it("cannot claim reward", async function(done){
      let owner = accounts[0];
      let researcher = accounts[1];
      let reward = web3.toWei(1, "ether");

      let bounty = await SecureTargetBounty.new();
      let event = bounty.TargetCreated({});

      event.watch(async function(err, result) {
        event.stopWatching();
        if (err) { throw err }
        var targetAddress = result.args.createdAddress;
        sendReward(owner, bounty.address, reward);
        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())

        try {
          let tmpClain = await bounty.claim(targetAddress, {from:researcher});
          done("should not come here");
        } catch(error) {
            let reClaimedBounty = await bounty.claimed.call();
            assert.isFalse(reClaimedBounty);
            try {
              let withdraw = await bounty.withdrawPayments({from:researcher});
              done("should not come here")
            } catch (err) {
              assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber())
            }
            done();
        }//end of first try catch
      });
      bounty.createTarget({from:researcher});
    })
  })

  describe("Against broken contract", function(){
    it("checkInvariant returns false", async function(){
      let bounty = await InsecureTargetBounty.new();
      let target = await bounty.createTarget();
      let invarriantCall = await bounty.checkInvariant.call();
      assert.isFalse(invarriantCall);
    })

    it("claims reward", async function(){
      let owner = accounts[0];
      let researcher = accounts[1];
      let reward = web3.toWei(1, "ether");

      let bounty = await InsecureTargetBounty.new();

      let event = bounty.TargetCreated({});

      event.watch(async function(err, result) {
        event.stopWatching();
        if (err) { throw err }
        let targetAddress = result.args.createdAddress;
        sendReward(owner, bounty.address, reward);
        assert.equal(reward, web3.eth.getBalance(bounty.address).toNumber());

        let bountyClaim = await bounty.claim(targetAddress, {from:researcher});
        let claim = await bounty.claimed.call();
        assert.isTrue(claim);
        let payment = await bounty.withdrawPayments({from:researcher});
        assert.equal(0, web3.eth.getBalance(bounty.address).toNumber());
      })
      bounty.createTarget({from:researcher});
    })
  })
});
