const assertJump = require('./helpers/assertJump');
const timer = require('./helpers/timer');

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

  describe('getting a token grant', async () => {
    const cliff = 10000
    const vesting = 20000 // seconds

    beforeEach(async () => {
      await token.grantVestedTokens(receiver, tokenAmount, now, now + cliff, now + vesting, { from: granter })
    })

    it('tokens are received', async () => {
      assert.equal(await token.balanceOf(receiver), tokenAmount);
    })

    it('has 0 transferable tokens before cliff', async () => {
      assert.equal(await token.transferableTokens(receiver, now), 0);
    })

    it('all tokens are transferable after vesting', async () => {
      assert.equal(await token.transferableTokens(receiver, now + vesting + 1), tokenAmount);
    })

    it('throws when trying to transfer non vested tokens', async () => {
      try {
        await token.transfer(accounts[7], 1, { from: receiver })
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
      await timer(vesting + 1);
      await token.transfer(accounts[7], tokenAmount, { from: receiver })
      assert.equal(await token.balanceOf(accounts[7]), tokenAmount);
    })
  })
});
