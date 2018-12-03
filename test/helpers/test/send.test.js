const send = require('../send');
const shouldFail = require('../shouldFail');
const expectEvent = require('../expectEvent');
const { ether } = require('../ether');
const { ethGetBalance } = require('../web3');

const Acknowledger = artifacts.require('Acknowledger');

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('send', function ([sender, receiver]) {
  describe('ether', function () {
    it('sends ether with no gas cost', async function () {
      const value = ether(1);

      const initialSenderBalance = await ethGetBalance(sender);
      const initialReceiverBalance = await ethGetBalance(receiver);

      await send.ether(sender, receiver, value);

      const finalSenderBalance = await ethGetBalance(sender);
      const finalReceiverBalance = await ethGetBalance(receiver);

      finalSenderBalance.sub(initialSenderBalance).should.be.bignumber.equal(-value);
      finalReceiverBalance.sub(initialReceiverBalance).should.be.bignumber.equal(value);
    });

    it('throws if the sender balance is insufficient', async function () {
      const value = (await ethGetBalance(sender)).plus(1);

      await shouldFail(send.ether(sender, receiver, value));
    });
  });

  describe('transaction', function () {
    beforeEach(async function () {
      this.acknowledger = await Acknowledger.new();
    });

    it('calls a function from its signature ', async function () {
      const { logs } = await send.transaction(this.acknowledger, 'foo', 'uint256', [3]);
      expectEvent.inLogs(logs, 'AcknowledgeFoo', { a: 3 });
    });

    it('calls overloaded functions with less arguments', async function () {
      const { logs } = await send.transaction(this.acknowledger, 'bar', 'uint256', [3]);
      expectEvent.inLogs(logs, 'AcknowledgeBarSingle', { a: 3 });
    });

    it('calls overloaded functions with more arguments', async function () {
      const { logs } = await send.transaction(this.acknowledger, 'bar', 'uint256,uint256', [3, 5]);
      expectEvent.inLogs(logs, 'AcknowledgeBarDouble', { a: 3, b: 5 });
    });

    it('throws if the number of arguments does not match', async function () {
      await shouldFail(send.transaction(this.acknowledger, 'foo', 'uint256, uint256', [3, 5]));
    });

    it('throws if the method does not exist', async function () {
      await shouldFail(send.transaction(this.acknowledger, 'baz', 'uint256', [3]));
    });

    it('throws if there is a mismatch in the number of types and values', async function () {
      await shouldFail(send.transaction(this.acknowledger, 'foo', 'uint256', [3, 3]));
    });
  });
});
