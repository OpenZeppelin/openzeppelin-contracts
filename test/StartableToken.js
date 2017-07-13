'user strict';

const assertJump = require('./helpers/assertJump');
var StartableTokenMock = artifacts.require('./helpers/StartableTokenMock.sol');

contract('StartableToken', function(accounts) {
    let token;

    beforeEach(async function() {
        token = await StartableTokenMock.new(accounts[0], 100);
    });

    it('should return paused true after construction', async function() {
        let paused = await token.paused();

        assert.equal(paused, true);
    });

    it('should return paused false after unpause', async function() {
        await token.start();
        let paused = await token.paused();

        assert.equal(paused, false);
    });

    it('should be able to transfer if transfers are unpaused', async function() {
        await token.start();
        await token.transfer(accounts[1], 100);
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, 0);

        let balance1 = await token.balanceOf(accounts[1]);
        assert.equal(balance1, 100);
    });

    it('should throw an error trying to transfer while transactions are paused', async function() {
        try {
            await token.transfer(accounts[1], 100);
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('should throw an error trying to transfer from another account while transactions are paused', async function() {
        try {
            await token.transferFrom(accounts[0], accounts[1], 100);
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown before');
    });
})