const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC5169() {
  shouldSupportInterfaces(['ERC5169']);
  shouldSupportInterfaces(['0xa86517a1']);

  describe('default', function () {
    it('setScriptURI/scriptURI', async function () {
      expect(await this.token.scriptURI()).to.deep.equal([]);

      const scripts = ['script1', 'script2'];
      await expect(this.token.setScriptURI(scripts)).to.emit(this.token, 'ScriptUpdate').withArgs(scripts);
      expect(await this.token.scriptURI()).to.deep.equal(scripts);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC5169,
};
