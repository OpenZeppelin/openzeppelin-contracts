const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeERC777DirectSend (holder, nonHolder, recipient, data) {
  describe('direct send', function () {
    context('when the sender has no tokens', function () {
      const from = nonHolder;

      shouldSendTokens(from, recipient, new BN('0'), data);

      it('reverts when sending a non-zero amount', async function () {
        await shouldFail.reverting(this.token.send(recipient, new BN('1'), data, { from }));
      });
    });

    context('when the sender has tokens', function () {
      const from = holder;

      shouldSendTokens(from, recipient, new BN('0'), data);
      shouldSendTokens(from, recipient, new BN('1'), data);

      it('reverts when sending more than the balance', async function () {
        const balance = await this.token.balanceOf(from);
        await shouldFail.reverting(this.token.send(recipient, balance.addn(1), data, { from }));
      });

      it('reverts when sending to the zero address', async function () {
        await shouldFail.reverting(this.token.send(ZERO_ADDRESS, new BN('1'), data, { from }));
      });
    });
  });
}

function shouldBehaveLikeERC777OperatorSend (holder, nonHolder, recipient, operator, data, operatorData) {
  describe('operator send', function () {
    context('when the sender has no tokens', function () {
      const from = nonHolder;

      shouldOperatorSendTokens(from, operator, recipient, new BN('0'), data, operatorData);

      it('reverts when sending a non-zero amount', async function () {
        await shouldFail.reverting(
          this.token.operatorSend(from, recipient, new BN('1'), data, operatorData, { from: operator })
        );
      });
    });

    context('when the sender has tokens', async function () {
      const from = holder;

      shouldOperatorSendTokens(from, operator, recipient, new BN('0'), data, operatorData);
      shouldOperatorSendTokens(from, operator, recipient, new BN('1'), data, operatorData);

      it('reverts when sending more than the balance', async function () {
        const balance = await this.token.balanceOf(from);
        await shouldFail.reverting(
          this.token.operatorSend(from, recipient, balance.addn(1), data, operatorData, { from: operator })
        );
      });

      it('reverts when sending to the zero address', async function () {
        await shouldFail.reverting(
          this.token.operatorSend(
            from, ZERO_ADDRESS, new BN('1'), data, operatorData, { from: operator }
          )
        );
      });
    });
  });
}

function shouldBehaveLikeERC777DirectBurn (holder, nonHolder, data) {
  describe('direct burn', function () {
    context('when the sender has no tokens', function () {
      const from = nonHolder;

      shouldBurnTokens(from, new BN('0'), data);

      it('reverts when burning a non-zero amount', async function () {
        await shouldFail.reverting(this.token.burn(new BN('1'), data, { from }));
      });
    });

    context('when the sender has tokens', function () {
      const from = holder;

      shouldBurnTokens(from, new BN('0'), data);
      shouldBurnTokens(from, new BN('1'), data);

      it('reverts when burning more than the balance', async function () {
        const balance = await this.token.balanceOf(from);
        await shouldFail.reverting(this.token.burn(balance.addn(1), data, { from }));
      });
    });
  });
}

function shouldBehaveLikeERC777OperatorBurn (holder, nonHolder, operator, data, operatorData) {
  describe('operator burn', function () {
    context('when the sender has no tokens', function () {
      const from = nonHolder;

      shouldOperatorBurnTokens(from, operator, new BN('0'), data, operatorData);

      it('reverts when burning a non-zero amount', async function () {
        await shouldFail.reverting(
          this.token.operatorBurn(from, new BN('1'), data, operatorData, { from: operator })
        );
      });
    });

    context('when the sender has tokens', async function () {
      const from = holder;

      shouldOperatorBurnTokens(from, operator, new BN('0'), data, operatorData);
      shouldOperatorBurnTokens(from, operator, new BN('1'), data, operatorData);

      it('reverts when burning more than the balance', async function () {
        const balance = await this.token.balanceOf(from);
        await shouldFail.reverting(
          this.token.operatorBurn(from, balance.addn(1), data, operatorData, { from: operator })
        );
      });
    });
  });
}

function shouldSendTokens (from, to, amount, data) {
  it(`can send an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialFromBalance = await this.token.balanceOf(from);
    const initialToBalance = await this.token.balanceOf(to);

    const { logs } = await this.token.send(to, amount, data, { from });
    expectEvent.inLogs(logs, 'Sent', {
      operator: from,
      from,
      to,
      amount,
      data,
      operatorData: null,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalFromBalance = await this.token.balanceOf(from);
    const finalToBalance = await this.token.balanceOf(to);

    finalTotalSupply.should.be.bignumber.equal(initialTotalSupply);
    finalToBalance.sub(initialToBalance).should.be.bignumber.equal(amount);
    finalFromBalance.sub(initialFromBalance).should.be.bignumber.equal(amount.neg());
  });
}

function shouldOperatorSendTokens (from, operator, to, amount, data, operatorData) {
  it(`operator can send an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialFromBalance = await this.token.balanceOf(from);
    const initialToBalance = await this.token.balanceOf(to);

    const { logs } = await this.token.operatorSend(from, to, amount, data, operatorData, { from: operator });
    expectEvent.inLogs(logs, 'Sent', {
      operator,
      from,
      to,
      amount,
      data,
      operatorData,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalFromBalance = await this.token.balanceOf(from);
    const finalToBalance = await this.token.balanceOf(to);

    finalTotalSupply.should.be.bignumber.equal(initialTotalSupply);
    finalToBalance.sub(initialToBalance).should.be.bignumber.equal(amount);
    finalFromBalance.sub(initialFromBalance).should.be.bignumber.equal(amount.neg());
  });
}

function shouldBurnTokens (from, amount, data) {
  it(`can burn an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialFromBalance = await this.token.balanceOf(from);

    const { logs } = await this.token.burn(amount, data, { from });
    expectEvent.inLogs(logs, 'Burned', {
      operator: from,
      from,
      amount,
      data,
      operatorData: null,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalFromBalance = await this.token.balanceOf(from);

    finalTotalSupply.sub(initialTotalSupply).should.be.bignumber.equal(amount.neg());
    finalFromBalance.sub(initialFromBalance).should.be.bignumber.equal(amount.neg());
  });
}

function shouldOperatorBurnTokens (from, operator, amount, data, operatorData) {
  it(`operator can burn an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialFromBalance = await this.token.balanceOf(from);

    const { logs } = await this.token.operatorBurn(from, amount, data, operatorData, { from: operator });
    expectEvent.inLogs(logs, 'Burned', {
      operator,
      from,
      amount,
      data,
      operatorData,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalFromBalance = await this.token.balanceOf(from);

    finalTotalSupply.sub(initialTotalSupply).should.be.bignumber.equal(amount.neg());
    finalFromBalance.sub(initialFromBalance).should.be.bignumber.equal(amount.neg());
  });
}

module.exports = {
  shouldBehaveLikeERC777DirectSend,
  shouldBehaveLikeERC777OperatorSend,
  shouldBehaveLikeERC777DirectBurn,
  shouldBehaveLikeERC777OperatorBurn,
  shouldSendTokens,
};
