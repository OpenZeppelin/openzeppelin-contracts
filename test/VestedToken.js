const assertJump = require('./helpers/assertJump');
const timer = require('./helpers/timer');
var VestedTokenMock = artifacts.require("./helpers/VestedTokenMock.sol");

contract('VestedToken', function(accounts) {
  let token = null
  let now = 0

  const tokenAmount = 50

  const granter = accounts[0]
  const receiver = accounts[1]

  beforeEach(async () => {
    token = await VestedTokenMock.new(granter, 100);
    now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  })

  it('granter can grant tokens without vesting', async () => {
    await token.transfer(receiver, tokenAmount, { from: granter })

    assert.equal(await token.balanceOf(receiver), tokenAmount);
    assert.equal(await token.transferableTokens(receiver, now), tokenAmount);
  })

  describe('getting a revokable/non-burnable token grant', async () => {
    const cliff = 10000
    const vesting = 20000 // seconds

    beforeEach(async () => {
      await token.grantVestedTokens(receiver, tokenAmount, now, now + cliff, now + vesting, true, false, { from: granter })
    })

    it('tokens are received', async () => {
      assert.equal(await token.balanceOf(receiver), tokenAmount);
    })

    it('has 0 transferable tokens before cliff', async () => {
      assert.equal(await token.transferableTokens(receiver, now), 0);
    })

    it('all tokens are transferable after vesting', async () => {
      assert.equal(await token.transferableTokens(receiver, now + vesting), tokenAmount);
    })

    it('throws when trying to transfer non vested tokens', async () => {
      try {
        await token.transfer(accounts[7], 1, { from: receiver })
      } catch(error) {
        return assertJump(error);
      }
      assert.fail('should have thrown before');
    })

    it('throws when trying to transfer from non vested tokens', async () => {
      try {
        await token.approve(accounts[7], 1, { from: receiver })
        await token.transferFrom(receiver, accounts[7], tokenAmount, { from: accounts[7] })
      } catch(error) {
        return assertJump(error);
      }
      assert.fail('should have thrown before');
    })

    it('can be revoked by granter', async () => {
      await token.revokeTokenGrant(receiver, 0, { from: granter });
      assert.equal(await token.balanceOf(receiver), 0);
      assert.equal(await token.balanceOf(granter), 100);
    })

    it('cannot be revoked by non granter', async () => {
      try {
        await token.revokeTokenGrant(receiver, 0, { from: accounts[3] });
      } catch(error) {
        return assertJump(error);
      }
      assert.fail('should have thrown before');
    })

    it('can be revoked by granter and non vested tokens are returned', async () => {
      await timer(cliff);
      await token.revokeTokenGrant(receiver, 0, { from: granter });
      assert.equal(await token.balanceOf(receiver), tokenAmount * cliff / vesting);
    })

    it('can transfer all tokens after vesting ends', async () => {
      await timer(vesting);
      await token.transfer(accounts[7], tokenAmount, { from: receiver })
      assert.equal(await token.balanceOf(accounts[7]), tokenAmount);
    })

    it('can approve and transferFrom all tokens after vesting ends', async () => {
      await timer(vesting);
      await token.approve(accounts[7], tokenAmount, { from: receiver })
      await token.transferFrom(receiver, accounts[7], tokenAmount, { from: accounts[7] })
      assert.equal(await token.balanceOf(accounts[7]), tokenAmount);
    })

    it('can handle composed vesting schedules', async () => {
      await timer(cliff);
      await token.transfer(accounts[7], 12, { from: receiver })
      assert.equal(await token.balanceOf(accounts[7]), 12);

      let newNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp

      await token.grantVestedTokens(receiver, tokenAmount, newNow, newNow + cliff, newNow + vesting, false, false, { from: granter })

      await token.transfer(accounts[7], 13, { from: receiver })
      assert.equal(await token.balanceOf(accounts[7]), tokenAmount / 2);

      assert.equal(await token.balanceOf(receiver), 3 * tokenAmount / 2)
      assert.equal(await token.transferableTokens(receiver, newNow), 0)
      await timer(vesting);
      await token.transfer(accounts[7], 3 * tokenAmount / 2, { from: receiver })
      assert.equal(await token.balanceOf(accounts[7]), tokenAmount * 2)
    })
  })

  describe('getting a non-revokable token grant', async () => {
    const cliff = 10000
    const vesting = 20000 // seconds

    beforeEach(async () => {
      await token.grantVestedTokens(receiver, tokenAmount, now, now + cliff, now + vesting, false, false, { from: granter })
    })

    it('tokens are received', async () => {
      assert.equal(await token.balanceOf(receiver), tokenAmount);
    })

    it('throws when granter attempts to revoke', async () => {
      try {
        await token.revokeTokenGrant(receiver, 0, { from: granter });
      } catch(error) {
        return assertJump(error);
      }
      assert.fail('should have thrown before');
    })
  })

  describe('getting a revokable/burnable token grant', async () => {
    const cliff = 100000
    const vesting = 200000 // seconds
    const burnAddress = '0x000000000000000000000000000000000000dead'

    beforeEach(async () => {
      await token.grantVestedTokens(receiver, tokenAmount, now, now + cliff, now + vesting, true, true, { from: granter })
    })

    it('tokens are received', async () => {
      assert.equal(await token.balanceOf(receiver), tokenAmount);
    })

    it('can be revoked by granter and tokens are burned', async () => {
      await token.revokeTokenGrant(receiver, 0, { from: granter });
      assert.equal(await token.balanceOf(receiver), 0);
      assert.equal(await token.balanceOf(burnAddress), tokenAmount);
    })

    it('cannot be revoked by non granter', async () => {
      try {
        await token.revokeTokenGrant(receiver, 0, { from: accounts[3] });
      } catch(error) {
        return assertJump(error);
      }
      assert.fail('should have thrown before');
    })

    it('can be revoked by granter and non vested tokens are returned', async () => {
      await timer(cliff);
      await token.revokeTokenGrant(receiver, 0, { from: granter });
      assert.equal(await token.balanceOf(burnAddress), tokenAmount * cliff / vesting);
    })
  })
});
