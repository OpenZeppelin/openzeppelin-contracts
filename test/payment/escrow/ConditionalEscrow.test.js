const { shouldBehaveLikeEscrow } = require('./Escrow.behavior');

const shouldFail = require('../../helpers/shouldFail');
const { ether } = require('../../helpers/ether');

require('../../helpers/setup');

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
    const amount = ether(23.0);

    beforeEach(async function () {
      await this.escrow.setAllowed(payee, false);
    });

    it('reverts on withdrawals', async function () {
      await this.escrow.deposit(payee, { from: owner, value: amount });

      await shouldFail.reverting(this.escrow.withdraw(payee, { from: owner }));
    });
  });
});
