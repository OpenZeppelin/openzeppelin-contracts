const { time, shouldFail } = require('openzeppelin-test-helpers');
const { expectBNIsWithinDelta } = require('../../helpers/expectBNIsWithinDelta');

const TimeFrameMock = artifacts.require('TimeFrameMock');

contract('TimeFrame', () => {
  beforeEach(async () => {
    this.now = await time.latest();

    this.oneWeek = await time.duration.weeks(1);
    this.twoWeeksAgo = await this.now - time.duration.weeks(2);
    this.oneWeekAgo = this.now - this.oneWeek;
    this.oneWeekFromNow = this.now + this.oneWeek;
    this.twoWeeksFromNow = await this.now + time.duration.weeks(2);
  });

  describe('#hasStarted', () => {
    it('it returns true when now if greater than start date', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);
      (await contract.hasStarted()).should.equal(true);
    });

    it('returns false when now is less than start date', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekFromNow, this.twoWeeksFromNow);
      (await contract.hasStarted()).should.equal(false);
    });
  });

  describe('#isActive', () => {
    it('it returns false when "now" is less than start', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekFromNow, this.twoWeeksFromNow);
      (await contract.isActive()).should.equal(false);
    });

    it('it returns true when "now" is greater than start and less than end', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekAgo, this.oneWeekFromNow);
      (await contract.isActive()).should.equal(true);
    });

    it('it returns false when "now" greater than end', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);
      (await contract.isActive()).should.equal(false);
    });
  });

  describe('#hasEnded', () => {
    it('it returns true when now is greater than end date', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);
      (await contract.hasEnded()).should.equal(true);
    });

    it('returns false when now is greater than end date', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekAgo, this.oneWeekFromNow);
      (await contract.hasEnded()).should.equal(false);
    });
  });

  describe('#timeUntilStart', () => {
    it('it returns the difference of time in seconds from now until start', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekFromNow, this.twoWeeksFromNow);

      const result = await contract.timeUntilStart();

      expectBNIsWithinDelta(result, this.oneWeek, 5);
    });

    it('reverts when epoch has already started', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);
      await shouldFail.reverting(contract.timeUntilStart());
    });
  });

  describe('#timeUntilEnd', () => {
    it('it returns the difference of time in seconds from now until end', async () => {
      const contract = await TimeFrameMock.new(this.now, this.oneWeekFromNow);

      const result = await contract.timeUntilEnd();

      expectBNIsWithinDelta(result, this.oneWeek, 5);
    });

    it('reverts when epoch has already ended', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);
      await shouldFail.reverting(contract.timeUntilEnd());
    });
  });

  describe('#elapsedSinceStart', () => {
    it('it returns the difference of time in seconds from start until now', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekAgo, this.oneWeekFromNow);

      const result = await contract.elapsedSinceStart();

      expectBNIsWithinDelta(result, this.oneWeek, 5);
    });

    it('reverts when epoch has not started', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekFromNow, this.twoWeeksFromNow);
      await shouldFail.reverting(contract.elapsedSinceStart());
    });
  });

  describe('#elapsedSinceEnd', () => {
    it('it returns the difference of time in seconds from end until now', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);

      const result = await contract.elapsedSinceEnd();

      expectBNIsWithinDelta(result, this.oneWeek, 5);
    });

    it('reverts when epoch has not ended', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekFromNow, this.twoWeeksFromNow);
      await shouldFail.reverting(contract.elapsedSinceEnd());
    });
  });

  describe('#length', () => {
    it('it returns the difference of time in seconds from start until end', async () => {
      const contract = await TimeFrameMock.new(this.now, this.oneWeekFromNow);
      (await contract.length()).should.be.bignumber.equal(this.oneWeek);
    });

    it('reverts when end is less than start date', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekFromNow, this.oneWeekAgo);
      await shouldFail.reverting(contract.length());
    });
  });

  describe('#terminate', () => {
    it('reverts when epoch has already ended', async () => {
      const contract = await TimeFrameMock.new(this.twoWeeksAgo, this.oneWeekAgo);
      await shouldFail.reverting(contract.terminate());
    });

    it('sets end to one second less than now', async () => {
      const contract = await TimeFrameMock.new(this.oneWeekAgo, this.oneWeekFromNow);

      await contract.terminate();

      (await contract.isActive()).should.equal(false);
    });
  });
});
