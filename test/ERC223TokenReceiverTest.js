const assertJump = require('./helpers/assertJump');

var ERC223ExampleToken = artifacts.require("../contracts/token/ERC223/example/ERC223ExampleToken.sol");
var ERC223TokenReceiverMock = artifacts.require("./helpers/ERC223TokenReceiverMock.sol");

contract('ERC223BasicToken', function(accounts) {
    let token;
    let receiver;

    beforeEach(async function() {
        token = await ERC223ExampleToken.new(100);
        receiver = await ERC223TokenReceiverMock.new();
    });

    it("Test fallback is called on transfer", async function() {
        let transfer = await token.transfer(receiver.address, 100);

        let tokenSender = await receiver.tokenSender();
        assert.equal(tokenSender, accounts[0]);
        let sentValue = await receiver.sentValue();
        assert.equal(sentValue, 100);
    })

    it("Test correct function is called on transfer", async function() {
        var data = new ArrayBuffer(4);
        let transfer = await token.transfer(receiver.address, 100, data);
        let calledFallback = await receiver.calledFallback();
        assert(calledFallback);
    })

    it("Should throw when sending to contract that is not ERC223ReceivingContract", async function() {
        try {
            let transfer = await token.transfer(token.address, 100);
        } catch(error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
        try {
            var data = new ArrayBuffer(4);
            let transfer = await token.transfer(token.address, 100, data);
        } catch(error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

});
