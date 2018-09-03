const { shouldBehaveLikeTokenEscrow } = require('./TokenEscrow.behavior');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ConditionalTokenEscrowMock = artifacts.require('ConditionalTokenEscrowMock');
const StandardToken = artifacts.require('StandardTokenMock');

contract('ConditionalTokenEscrow', function ([_, owner, payee, ...otherAccounts]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

  it('reverts when deployed with a null token address', async function () {
    await expectThrow(
      ConditionalTokenEscrowMock.new(ZERO_ADDRESS, { from: owner }), EVMRevert
    );
  });

  context('with token', function () {
    beforeEach(async function () {
      this.token = await StandardToken.new(owner, MAX_UINT256);
      this.escrow = await ConditionalTokenEscrowMock.new(this.token.address, { from: owner });
    });

    context('when withdrawal is allowed', function () {
      beforeEach(async function () {
        await Promise.all(otherAccounts.map(
          payee => this.escrow.setAllowed(payee, true))
        );
      });

      shouldBehaveLikeTokenEscrow(owner, otherAccounts);
    });

    context('when withdrawal is disallowed', function () {
      const amount = web3.toWei(23.0, 'ether');

      beforeEach(async function () {
        await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
        await this.escrow.setAllowed(payee, false);
      });

      it('reverts on withdrawals', async function () {
        await this.escrow.deposit(payee, amount, { from: owner });

        await expectThrow(this.escrow.withdraw(payee, { from: owner }), EVMRevert);
      });
    });
  });
});
