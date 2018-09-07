const LockableToken = artifacts.require('LockableToken');
const { assertRevert } = require('../../helpers/assertRevert');

const supply = 1000;
const lockReason = 'GOV';
const lockReason2 = 'CLAIM';
const lockReason3 = 'VESTED';
const lockReason4 = 'GB';
const lockReason5 = 'MG';
const lockReason6 = 'OZ';
const lockedAmount = 200;
const lockPeriod = 1000;
let blockNumber = web3.eth.blockNumber;
const lockTimestamp = web3.eth.getBlock(blockNumber).timestamp;
let token;

const increaseTime = function (duration) {
  web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: lockTimestamp
    },
    (err, resp) => {
      if (!err) {
        web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          params: [],
          id: lockTimestamp + 1
        });
      }
    }
  );
};

contract('LockableToken', ([owner, receiver, spender]) => {
  before(async () => {
    token = await LockableToken.new(supply);
  });

  it('can be created', () => {
    assert.ok(token);
  });

  it('has the right balance for the contract owner', async () => {
    const balance = await token.balanceOf(owner);
    const totalBalance = await token.totalBalanceOf(owner);
    const totalSupply = await token.totalSupply();
    assert.equal(balance.toNumber(), supply);
    assert.equal(totalBalance.toNumber(), supply);
    assert.equal(totalSupply.toNumber(), supply);
  });

  it('has the right total balance for the contract owner', async () => {
    const balance = await token.totalBalanceOf(owner);
    assert.equal(balance.toNumber(), supply);
  });

  it('reduces locked tokens from transferable balance', async () => {
    const origBalance = await token.balanceOf(owner);
    blockNumber = await web3.eth.blockNumber;
    const newLockTimestamp = await web3.eth.getBlock(blockNumber).timestamp;
    await token.lock(lockReason, lockedAmount, lockPeriod);
    const balance = await token.balanceOf(owner);
    const totalBalance = await token.totalBalanceOf(owner);
    assert.equal(balance.toNumber(), origBalance.toNumber() - lockedAmount);
    assert.equal(totalBalance.toNumber(), origBalance.toNumber());
    let actualLockedAmount = await token.tokensLocked(owner, lockReason);
    assert.equal(lockedAmount, actualLockedAmount.toNumber());
    actualLockedAmount = await token.tokensLockedAtTime(
      owner,
      lockReason,
      newLockTimestamp + lockPeriod + 1
    );
    assert.equal(0, actualLockedAmount.toNumber());

    const transferAmount = 1;
    const {
      logs
    } = await token.transfer(receiver, transferAmount, {
      from: owner
    });
    const newSenderBalance = await token.balanceOf(owner);
    const newReceiverBalance = await token.balanceOf(receiver);
    assert.equal(newReceiverBalance.toNumber(), transferAmount);
    assert.equal(newSenderBalance.toNumber(), balance - transferAmount);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, 'Transfer');
    assert.equal(logs[0].args.from, owner);
    assert.equal(logs[0].args.to, receiver);
    assert(logs[0].args.value.eq(transferAmount));
  });

  it('reverts locking more tokens via lock function', async () => {
    const balance = await token.balanceOf(owner);
    await assertRevert(token.lock(lockReason, balance, lockPeriod));
  });

  it('can extend lock period for an existing lock', async () => {
    await token.tokensLocked(owner, lockReason);
    const lockValidityOrig = await token.locked(owner, lockReason);
    await token.extendLock(lockReason, lockPeriod);
    const lockValidityExtended = await token.locked(owner, lockReason);
    assert.equal(
      lockValidityExtended[1].toNumber(),
      lockValidityOrig[1].toNumber() + lockPeriod
    );
    await assertRevert(token.extendLock(lockReason2, lockPeriod));
    await assertRevert(token.increaseLockAmount(lockReason2, lockPeriod));
  });

  it('can increase the number of tokens locked', async () => {
    const actualLockedAmount = await token.tokensLocked(owner, lockReason);
    await token.increaseLockAmount(lockReason, lockedAmount);
    const increasedLockAmount = await token.tokensLocked(owner, lockReason);
    assert.equal(
      increasedLockAmount.toNumber(),
      actualLockedAmount.toNumber() + lockedAmount
    );
  });

  it('can unLockTokens', async () => {
    const lockValidityExtended = await token.locked(owner, lockReason);
    const balance = await token.balanceOf(owner);
    const tokensLocked = await token.tokensLockedAtTime(
      owner,
      lockReason,
      lockTimestamp
    );
    await increaseTime(
      lockValidityExtended[1].toNumber() + 60 - lockTimestamp
    );
    let unlockableToken = await token.getUnlockableTokens(owner);
    assert.equal(unlockableToken.toNumber(), tokensLocked.toNumber());
    await token.unlock(owner);
    unlockableToken = await token.getUnlockableTokens(owner);
    assert.equal(unlockableToken.toNumber(), 0);
    const newBalance = await token.balanceOf(owner);
    assert.equal(
      newBalance.toNumber(),
      balance.toNumber() + tokensLocked.toNumber()
    );
    await token.unlock(owner);
    const newNewBalance = await token.balanceOf(owner);
    assert.equal(newBalance.toNumber(), newNewBalance.toNumber());
  });

  it('should allow to lock token again', async () => {
    await token.lock(lockReason4, 1, 0);
    await token.unlock(owner);
    await token.lock(lockReason4, 1, 100000);
    const actualLockedAmount = await token.tokensLocked(owner, lockReason4);
    assert.equal(actualLockedAmount.toNumber(), 1);
  });

  it('can transferWithLock', async () => {
    const ownerBalance = (await token.balanceOf(owner)).toNumber();
    const receiverBalance = (await token.balanceOf(receiver)).toNumber();
    await token.transferWithLock(receiver, lockReason3, ownerBalance - 1, 0);
    await assertRevert(
      token.transferWithLock(receiver, lockReason3, ownerBalance, lockPeriod)
    );
    const locked = await token.locked(receiver, lockReason3);
    assert.equal((await token.balanceOf(owner)).toNumber(), 1);
    assert.equal(
      (await token.balanceOf(receiver)).toNumber(),
      receiverBalance
    );
    assert.equal(locked[0].toNumber(), ownerBalance - 1);
  });

  it('should not allow 0 lock amount', async () => {
    await assertRevert(token.lock(lockReason5, 0, lockTimestamp));
    await assertRevert(
      token.transferWithLock(receiver, lockReason5, 0, lockPeriod)
    );
  });

  it('should show 0 lock amount for unknown reasons', async () => {
    const actualLockedAmount = await token.tokensLocked(owner, lockReason6);
    assert.equal(actualLockedAmount.toNumber(), 0);
  });

  it('should not allow to increase lock amount by more than balance', async () => {
    await assertRevert(
      token.increaseLockAmount(
        lockReason,
        (await token.balanceOf(owner)).toNumber() + 1
      )
    );
  });

  it('should not allow to transfer and lock more than balance', async () => {
    const ownerBalance = (await token.balanceOf(owner)).toNumber();
    await assertRevert(
      token.transferWithLock(receiver, lockReason6, ownerBalance + 1, lockPeriod)
    );
  });

  it('should allow transfer with lock again after claiming', async () => {
    await token.unlock(receiver);
    const oldlLockedAmount = await token.tokensLocked(receiver, lockReason3);
    await token.transferWithLock(receiver, lockReason3, 1, 10000);
    const newLockedAmount = await token.tokensLocked(receiver, lockReason3);
    assert.equal(newLockedAmount.toNumber(), oldlLockedAmount.toNumber() + 1);
  });
});
