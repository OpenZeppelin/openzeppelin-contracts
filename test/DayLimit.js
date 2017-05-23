'use strict';
const assertJump = require('./helpers/assertJump');

var DayLimitMock = artifacts.require('helpers/DayLimitMock.sol');

contract('DayLimit', function(accounts) {

  it('should construct with the passed daily limit', async function() {
    let initLimit = 10;
    let dayLimit = await DayLimitMock.new(initLimit);
    let dailyLimit = await dayLimit.dailyLimit();
    assert.equal(initLimit, dailyLimit);
  });

  it('should be able to spend if daily limit is not reached', async function() {
    let limit = 10;
    let dayLimit = await DayLimitMock.new(limit);

    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await dayLimit.attemptSpend(2);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 10);
  });

  it('should prevent spending if daily limit is reached', async function() {
    let limit = 10;
    let dayLimit = await DayLimitMock.new(limit);

    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
        await dayLimit.attemptSpend(3);
    } catch(error) {
        assertJump(error);
    }
  });

  it('should allow spending if daily limit is reached and then set higher', async function() {
    let limit = 10;
    let dayLimit = await DayLimitMock.new(limit);

    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
        await dayLimit.attemptSpend(3);
    } catch(error) {
        assertJump(error);
    }
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await dayLimit.setDailyLimit(15);
    await dayLimit.attemptSpend(3);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 11);
  });

  it('should allow spending if daily limit is reached and then amount spent is reset', async function() {
    let limit = 10;
    let dayLimit = await DayLimitMock.new(limit);

    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
        await dayLimit.attemptSpend(3);
    } catch(error) {
        assertJump(error);
    }
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await dayLimit.resetSpentToday(15);
    await dayLimit.attemptSpend(3);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 3);
  });

});
