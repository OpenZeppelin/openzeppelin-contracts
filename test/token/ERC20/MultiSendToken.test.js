import assertRevert from '../../helpers/assertRevert';

const BigNumber = web3.BigNumber;

const MultiSendTokenMock = artifacts.require('MultiSendTokenMock');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('MultiSendToken', function ([owner, recipient1, recipient2]) {
  const initialBalance = 1000;

  beforeEach(async function () {
    this.token = await MultiSendTokenMock.new(owner, initialBalance);
  });

  describe('multiSend', function () {
    const amount = 500;

    context('when the arrays have different lengths', function () {
      it('reverts', async function () {
        await assertRevert(this.token.multiSend([recipient1, recipient2], [amount], { from: owner }));
      });
    });

    context('when the arrays have the same lengths', function () {
      it('transfers succesfully', async function () {
        await this.token.multiSend([recipient1, recipient2], [amount, amount], { from: owner }).should.be.fulfilled;
      });
    });

    context('when the sender has\'t enough balance', function () {
      it('reverts', async function () {
        await assertRevert(this.token.multiSend([recipient1, recipient2], [amount, amount + 1], { from: owner }));
      });
    });

    context('when the sender has enough balance', function () {
      it('transfers the amounts', async function () {
        await this.token.multiSend([recipient1, recipient2], [amount, amount], { from: owner });

        const senderBalance = await this.token.balanceOf(owner);
        senderBalance.should.be.bignumber.equal(0);

        const recipient1Balance = await this.token.balanceOf(recipient1);
        recipient1Balance.should.be.bignumber.equal(amount);

        const recipient2Balance = await this.token.balanceOf(recipient2);
        recipient2Balance.should.be.bignumber.equal(amount);
      });
    });
  });
});
