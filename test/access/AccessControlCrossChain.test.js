const { expectRevert } = require('@openzeppelin/test-helpers');
const { CrossChainHelper } = require('../crosschain/helper.web3js');

const {
  shouldBehaveLikeAccessControl,
} = require('./AccessControl.behavior.js');

const aliasRole = (role) => web3.utils.leftPad(
  web3.utils.toHex(web3.utils.toBN(role).xor(web3.utils.toBN(web3.utils.soliditySha3('CROSSCHAIN_ALIAS')))),
  64,
);

const AccessControlCrossChainMock = artifacts.require('AccessControlCrossChainMock');

const ROLE = web3.utils.soliditySha3('ROLE');

contract('AccessControl', function (accounts) {
  const crosschain = new CrossChainHelper();

  crosschain.before();

  beforeEach(async function () {
    this.accessControl = await AccessControlCrossChainMock.new({ from: accounts[0] });
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);

  describe('CrossChain enabled', function () {
    beforeEach(async function () {
      await this.accessControl.grantRole(ROLE, accounts[0], { from: accounts[0] });
      await this.accessControl.grantRole(aliasRole(ROLE), accounts[1], { from: accounts[0] });
    });

    it('check alliassing', async function () {
      expect(await this.accessControl.aliasRole(ROLE)).to.be.bignumber.equal(aliasRole(ROLE));
    });

    it('Crosschain calls not authorized to non-aliased addresses', async function () {
      await expectRevert(
        crosschain.call(
          accounts[0],
          this.accessControl,
          'senderProtected',
          [ ROLE ],
        ),
        `AccessControl: account ${accounts[0].toLowerCase()} is missing role ${aliasRole(ROLE)}`,
      );
    });

    it('Crosschain calls not authorized to non-aliased addresses', async function () {
      await crosschain.call(
        accounts[1],
        this.accessControl,
        'senderProtected',
        [ ROLE ],
      );
    });
  });
});
