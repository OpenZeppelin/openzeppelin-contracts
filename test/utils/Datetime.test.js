const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Datetime = artifacts.require('Datetime');
const DatetimeMock = artifacts.require('DatetimeMock');

const seconds = 1;
const minutes = 60 * seconds;
const hours = 60 * minutes;
const days = 24 * hours;

contract('Datetime', function () {
  before(async function () {
    const datetimeLib = await Datetime.new();
    await DatetimeMock.link(datetimeLib);
  });

  beforeEach(async function () {
    this.datetime = await DatetimeMock.new();
  });

  describe('leap day', function () {
    it('year not divisible by 4 is not a leap year', async function () {
      await expectRevert(this.datetime.date(1970, 2, 29), 'Invalid day');
    });

    it('test first leap day after unix epoch', async function () {
      expect(await this.datetime.date(1972, 2, 29)).to.be.bignumber.equal(`${(365 + 365 + 31 + 28) * days}`);
      expect(await this.datetime.date(1972, 3, 1)).to.be.bignumber.equal(`${(365 + 365 + 31 + 29) * days}`);
    });

    it('year divisible by 400 is a leap year', async function () {
      expect(await this.datetime.date(2000, 2, 29)).to.be.bignumber.equal('951782400');
    });

    it('year divisible by 100 is not a leap year', async function () {
      await expectRevert(this.datetime.date(2100, 2, 29), 'Invalid day');
    });
  });

  describe('invalid dates and times', function () {
    it('cannot have more than 24 hours in a day', async function () {
      await expectRevert(this.datetime.datetime(1970, 1, 1, 25, 0, 0), 'Invalid hour');
    });

    it('cannot have more than 60 minutes in an hour', async function () {
      await expectRevert(this.datetime.datetime(1970, 1, 1, 0, 60, 0), 'Invalid minute');
    });

    it('cannot have more than 60 seconds in a minute', async function () {
      await expectRevert(this.datetime.datetime(1970, 1, 1, 0, 0, 60), 'Invalid second');
    });

    it('months cannot have extra days', async function () {
      await expectRevert(this.datetime.date(1970, 1, 32), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 2, 29), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 3, 32), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 4, 31), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 5, 32), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 6, 31), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 7, 32), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 8, 32), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 9, 31), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 10, 32), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 11, 31), 'Invalid day');
      await expectRevert(this.datetime.date(1970, 12, 32), 'Invalid day');
    });
  });

  describe('2038 bug', function () {
    it('2038-01-19 3:14:07 is Y2K38', async function () {
      expect(await this.datetime.datetime(2038, 1, 19, 3, 14, 7)).to.be.bignumber.equal('2147483647');
    });

    it('2038-01-19 3:14:08 is 2**31', async function () {
      expect(await this.datetime.datetime(2038, 1, 19, 3, 14, 8)).to.be.bignumber.equal('2147483648');
    });
  });
});
