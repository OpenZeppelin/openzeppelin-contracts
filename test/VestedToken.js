const assertJump = require('./helpers/assertJump');
const timer = require('./helpers/timer');

contract('VestedToken', function(accounts) {
  
  let token = null;
  let now = 0;

  const tokenAmount = 50;

  const granter = accounts[3];
  const receiver = accounts[4];

  beforeEach(async () => {
    token = await VestedTokenMock.new(granter, tokenAmount*2);
    now = +new Date()/1000;
    var block = await web3.eth.getBlock('latest');
    now = block.timestamp;
  });

  it('granter can grant tokens without vesting', async () => {
    await token.transfer(receiver, tokenAmount, { from: granter });

    assert.equal(await token.balanceOf(receiver), tokenAmount);
    assert.equal(await token.transferableTokens(receiver, +new Date()/1000), tokenAmount);
  })

  describe('getting a token grant', async () => {
    const cliff = 10;
    const vesting = 20; // seconds

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
        await token.transfer(accounts[9], 1, { from: receiver })
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
        await token.revokeTokenGrant(receiver, 0, { from: accounts[9] });
      } catch(error) {
        return assertJump(error);
      }
      assert.fail('should have thrown before');
    })

    it.only('can be revoked by granter and non vested tokens are returned', async () => {
      await timer(cliff);
      await token.revokeTokenGrant(receiver, 0, { from: granter });
      var balance = await token.balanceOf(receiver);
      var expectedBalance = tokenAmount * cliff / vesting;
      console.log('real balance', balance.toString());
      console.log('expected    ', expectedBalance);
      assert.equal(balance, expectedBalance);
    })

    it('can transfer all tokens after vesting ends', async () => {
      await timer(vesting + 1);
      await token.transfer(accounts[9], tokenAmount, { from: receiver })
      assert.equal(await token.balanceOf(accounts[9]), tokenAmount);
    })
  })
});
