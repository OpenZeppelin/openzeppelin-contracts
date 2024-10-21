const { expect } = require('chai');

const time = require('../../helpers/time');

function shouldBehaveLikeERC6372(mode = 'blocknumber') {
  describe('should implement ERC-6372', function () {
    beforeEach(async function () {
      this.mock = this.mock ?? this.token ?? this.votes;
    });

    it('clock is correct', async function () {
      expect(await this.mock.clock()).to.equal(await time.clock[mode]());
    });

    it('CLOCK_MODE is correct', async function () {
      const params = new URLSearchParams(await this.mock.CLOCK_MODE());
      expect(params.get('mode')).to.equal(mode);
      expect(params.get('from')).to.equal(mode == 'blocknumber' ? 'default' : null);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC6372,
};
