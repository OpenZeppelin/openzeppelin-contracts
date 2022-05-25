const { expectRevert } = require('@openzeppelin/test-helpers');
const { BridgeHelper } = require('../helpers/crosschain');

const {
  shouldBehaveLikeAccessControl,
} = require('./AccessControl.behavior.js');

const crossChainRoleAlias = (role) => web3.utils.leftPad(
  web3.utils.toHex(web3.utils.toBN(role).xor(web3.utils.toBN(web3.utils.soliditySha3('CROSSCHAIN_ALIAS')))),
  64,
);

const AccessControlCrossChainMock = artifacts.require('AccessControlCrossChainMock');

const ROLE = web3.utils.soliditySha3('ROLE');

contract('AccessControl', function (accounts) {
  before(async function () {
    this.bridge = await BridgeHelper.deploy();
  });

  beforeEach(async function () {
    this.accessControl = await AccessControlCrossChainMock.new({ from: accounts[0] });
  });

  shouldBehaveLikeAccessControl('AccessControl', ...accounts);

  describe('CrossChain enabled', function () {
    beforeEach(async function () {
      await this.accessControl.grantRole(ROLE, accounts[0], { from: accounts[0] });
      await this.accessControl.grantRole(crossChainRoleAlias(ROLE), accounts[1], { from: accounts[0] });
    });

    it('check alliassing', async function () {
      expect(await this.accessControl.crossChainRoleAlias(ROLE)).to.be.bignumber.equal(crossChainRoleAlias(ROLE));
    });

    it('Crosschain calls not authorized to non-aliased addresses', async function () {
      await expectRevert(
        this.bridge.call(
          accounts[0],
          this.accessControl,
          'senderProtected',
          [ ROLE ],
        ),
        `AccessControl: account ${accounts[0].toLowerCase()} is missing role ${crossChainRoleAlias(ROLE)}`,
      );
    });

    it('Crosschain calls not authorized to non-aliased addresses', async function () {
      await this.bridge.call(
        accounts[1],
        this.accessControl,
        'senderProtected',
        [ ROLE ],
      );
    });
  });
});
