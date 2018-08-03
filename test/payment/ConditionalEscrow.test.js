const { shouldBehaveLikeEscrow } = require('./Escrow.behavior');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ConditionalEscrowMock = artifacts.require('ConditionalEscrowMock');

contract('ConditionalEscrow', function ([_, owner, payee, ...otherAccounts]) {
  beforeEach(async function () {
    this.escrow = await ConditionalEscrowMock.new({ from: owner });
  });

  context('when withdrawal is allowed', function () {
    beforeEach(async function () {
      await Promise.all(otherAccounts.map(payee => this.escrow.setAllowed(payee, true)));
    });

    shouldBehaveLikeEscrow(owner, otherAccounts);
  });

  context('when withdrawal is disallowed', function () {
    const amount = web3.toWei(23.0, 'ether');

    beforeEach(async function () {
      await this.escrow.setAllowed(payee, false);
    });

    it('reverts on withdrawals', async function () {
      await this.escrow.deposit(payee, { from: owner, value: amount });

      await expectThrow(this.escrow.withdraw(payee, { from: owner }), EVMRevert);
    });
  });
});
