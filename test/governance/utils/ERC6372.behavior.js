const { expect } = require('chai');
const time = require('../../helpers/time');

function shouldBehaveLikeERC6372(mode = 'blocknumber') {
  describe(`ERC-6372 behavior in ${mode} mode`, function () {
    beforeEach(async function () {
      this.mock = this.mock ?? this.token ?? this.votes;
    });

    it('should have a correct clock value', async function () {
      const currentClock = await this.mock.clock();
      const expectedClock = await time.clock[mode]();
      expect(currentClock).to.equal(expectedClock, `Clock mismatch in ${mode} mode`);
    });

    it('should have the correct CLOCK_MODE parameters', async function () {
      const clockModeParams = new URLSearchParams(await this.mock.CLOCK_MODE());
      const expectedFromValue = mode === 'blocknumber' ? 'default' : null;

      expect(clockModeParams.get('mode')).to.equal(mode, `Expected mode to be ${mode}`);
      expect(clockModeParams.get('from')).to.equal(expectedFromValue, `Expected 'from' to be ${expectedFromValue}`);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC6372,
};
