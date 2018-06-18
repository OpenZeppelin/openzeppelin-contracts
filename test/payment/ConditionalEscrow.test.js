import { shouldBehaveLikeEscrow } from './Escrow.behaviour';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ConditionalEscrowMock = artifacts.require('ConditionalEscrowMock');

contract('ConditionalEscrow', function (accounts) {
  beforeEach(async function () {
    this.escrow = await ConditionalEscrowMock.new();
  });

  context('when withdrawal is allowed', function () {
    beforeEach(async function () {
      await Promise.all(accounts.map(payee => this.escrow.setAllowed(payee, true)));
    });

    shouldBehaveLikeEscrow(accounts);
  });

  context('when withdrawal is disallowed', function () {
    const amount = web3.toWei(23.0, 'ether');

    const payee = accounts[0];
    const payer = accounts[1];
    const withdrawer = accounts[2];

    beforeEach(async function () {
      await this.escrow.setAllowed(payee, false);
    });

    it('reverts on withdrawals', async function () {
      await this.escrow.deposit(payee, { from: payer, value: amount });

      await this.escrow.withdraw(payee, { from: withdrawer }).should.be.rejectedWith(EVMRevert);
    });
  });
});
