const assertJump = require('./helpers/assertJump');

var ERC223ExampleToken = artifacts.require("../contracts/token/ERC223/example/ERC223ExampleToken.sol");

contract('ERC223BasicToken', function(accounts) {
    let token;

    beforeEach(async function() {
        token = await ERC223ExampleToken.new(100);
    });

    it("should return the correct totalSupply after construction", async function() {
        let totalSupply = await token.totalSupply();

        assert.equal(totalSupply, 100);
    })

    it("should return correct balances after transfer", async function(){
        let transfer = await token.transfer(accounts[1], 100);

        let firstAccountBalance = await token.balanceOf(accounts[0]);
        assert.equal(firstAccountBalance, 0);

        let secondAccountBalance = await token.balanceOf(accounts[1]);
        assert.equal(secondAccountBalance, 100);
    });

    it("should throw an error when trying to transfer more than balance", async function() {
        try {
            let transfer = await token.transfer(accounts[1], 101);
        } catch(error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

});
