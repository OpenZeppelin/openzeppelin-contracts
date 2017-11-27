'use strict';
const assertRevert = require('./helpers/assertRevert');
import latestTime from './helpers/latestTime'
import {increaseTimeTo, duration} from './helpers/increaseTime'

var DayLimitMock = artifacts.require('./helpers/DayLimitMock.sol');

contract('DayLimit', function(accounts) {

  let dayLimit;
  let initLimit = 10;

  beforeEach( async function() {
    this.startTime = latestTime();
    dayLimit = await DayLimitMock.new(initLimit);
  });

  it('should construct with the passed daily limit', async function() {
    let dailyLimit = await dayLimit.dailyLimit();
    assert.equal(initLimit, dailyLimit);
  });

  it('should be able to spend if daily limit is not reached', async function() {
    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await dayLimit.attemptSpend(2);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 10);
  });

  it('should prevent spending if daily limit is reached', async function() {
    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
      await dayLimit.attemptSpend(3);
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should allow spending if daily limit is reached and then set higher', async function() {
    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
      await dayLimit.attemptSpend(3);
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await dayLimit.setDailyLimit(15);
    await dayLimit.attemptSpend(3);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 11);
  });

  it('should allow spending if daily limit is reached and then amount spent is reset', async function() {
    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
      await dayLimit.attemptSpend(3);
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await dayLimit.resetSpentToday();
    await dayLimit.attemptSpend(3);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 3);
  });

  it('should allow spending if daily limit is reached and then the next has come', async function() {
    let limit = 10;
    let dayLimit = await DayLimitMock.new(limit);

    await dayLimit.attemptSpend(8);
    let spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    try {
      await dayLimit.attemptSpend(3);
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 8);

    await increaseTimeTo(this.startTime + duration.days(1));

    await dayLimit.attemptSpend(3);
    spentToday = await dayLimit.spentToday();
    assert.equal(spentToday, 3);
  });

});
