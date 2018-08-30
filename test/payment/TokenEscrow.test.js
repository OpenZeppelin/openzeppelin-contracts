const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behavior');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

const TokenEscrow = artifacts.require('TokenEscrow');
const StandardToken = artifacts.require('StandardTokenMock');

contract('TokenEscrow', function ([_, owner, ...otherAccounts]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

  it('reverts when deployed with a null token address', async function () {
    await expectThrow(
      TokenEscrow.new(ZERO_ADDRESS, { from: owner }), EVMRevert
    );
  });

  context('with token', function () {
    beforeEach(async function () {
      this.token = await StandardToken.new(owner, MAX_UINT256);
      this.escrow = await TokenEscrow.new(this.token.address, { from: owner });
    });

    shouldBehaveLikeTokenEscrow(owner, otherAccounts);
  });
});
