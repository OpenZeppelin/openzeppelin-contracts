const { contract, web3 } = require('@openzeppelin/test-environment');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC777SenderRecipientMock = contract.fromArtifact('ERC777SenderRecipientMock');

function shouldBehaveLikeERC777DirectSendBurn (holder, recipient, data) {
  shouldBehaveLikeERC777DirectSend(holder, recipient, data);
  shouldBehaveLikeERC777DirectBurn(holder, data);
}

function shouldBehaveLikeERC777OperatorSendBurn (holder, recipient, operator, data, operatorData) {
  shouldBehaveLikeERC777OperatorSend(holder, recipient, operator, data, operatorData);
  shouldBehaveLikeERC777OperatorBurn(holder, operator, data, operatorData);
}

function shouldBehaveLikeERC777UnauthorizedOperatorSendBurn (holder, recipient, operator, data, operatorData) {
  shouldBehaveLikeERC777UnauthorizedOperatorSend(holder, recipient, operator, data, operatorData);
  shouldBehaveLikeERC777UnauthorizedOperatorBurn(holder, operator, data, operatorData);
}

function shouldBehaveLikeERC777DirectSend (holder, recipient, data) {
  describe('direct send', function () {
    context('when the sender has tokens', function () {
      shouldDirectSendTokens(holder, recipient, new BN('0'), data);
      shouldDirectSendTokens(holder, recipient, new BN('1'), data);

      it('reverts when sending more than the balance', async function () {
        const balance = await this.token.balanceOf(holder);
        await expectRevert.unspecified(this.token.send(recipient, balance.addn(1), data, { from: holder }));
      });

      it('reverts when sending to the zero address', async function () {
        await expectRevert.unspecified(this.token.send(ZERO_ADDRESS, new BN('1'), data, { from: holder }));
      });
    });

    context('when the sender has no tokens', function () {
      removeBalance(holder);

      shouldDirectSendTokens(holder, recipient, new BN('0'), data);

      it('reverts when sending a non-zero amount', async function () {
        await expectRevert.unspecified(this.token.send(recipient, new BN('1'), data, { from: holder }));
      });
    });
  });
}

function shouldBehaveLikeERC777OperatorSend (holder, recipient, operator, data, operatorData) {
  describe('operator send', function () {
    context('when the sender has tokens', async function () {
      shouldOperatorSendTokens(holder, operator, recipient, new BN('0'), data, operatorData);
      shouldOperatorSendTokens(holder, operator, recipient, new BN('1'), data, operatorData);

      it('reverts when sending more than the balance', async function () {
        const balance = await this.token.balanceOf(holder);
        await expectRevert.unspecified(
          this.token.operatorSend(holder, recipient, balance.addn(1), data, operatorData, { from: operator })
        );
      });

      it('reverts when sending to the zero address', async function () {
        await expectRevert.unspecified(
          this.token.operatorSend(
            holder, ZERO_ADDRESS, new BN('1'), data, operatorData, { from: operator }
          )
        );
      });
    });

    context('when the sender has no tokens', function () {
      removeBalance(holder);

      shouldOperatorSendTokens(holder, operator, recipient, new BN('0'), data, operatorData);

      it('reverts when sending a non-zero amount', async function () {
        await expectRevert.unspecified(
          this.token.operatorSend(holder, recipient, new BN('1'), data, operatorData, { from: operator })
        );
      });

      it('reverts when sending from the zero address', async function () {
        // This is not yet reflected in the spec
        await expectRevert.unspecified(
          this.token.operatorSend(
            ZERO_ADDRESS, recipient, new BN('0'), data, operatorData, { from: operator }
          )
        );
      });
    });
  });
}

function shouldBehaveLikeERC777UnauthorizedOperatorSend (holder, recipient, operator, data, operatorData) {
  describe('operator send', function () {
    it('reverts', async function () {
      await expectRevert.unspecified(this.token.operatorSend(holder, recipient, new BN('0'), data, operatorData));
    });
  });
}

function shouldBehaveLikeERC777DirectBurn (holder, data) {
  describe('direct burn', function () {
    context('when the sender has tokens', function () {
      shouldDirectBurnTokens(holder, new BN('0'), data);
      shouldDirectBurnTokens(holder, new BN('1'), data);

      it('reverts when burning more than the balance', async function () {
        const balance = await this.token.balanceOf(holder);
        await expectRevert.unspecified(this.token.burn(balance.addn(1), data, { from: holder }));
      });
    });

    context('when the sender has no tokens', function () {
      removeBalance(holder);

      shouldDirectBurnTokens(holder, new BN('0'), data);

      it('reverts when burning a non-zero amount', async function () {
        await expectRevert.unspecified(this.token.burn(new BN('1'), data, { from: holder }));
      });
    });
  });
}

function shouldBehaveLikeERC777OperatorBurn (holder, operator, data, operatorData) {
  describe('operator burn', function () {
    context('when the sender has tokens', async function () {
      shouldOperatorBurnTokens(holder, operator, new BN('0'), data, operatorData);
      shouldOperatorBurnTokens(holder, operator, new BN('1'), data, operatorData);

      it('reverts when burning more than the balance', async function () {
        const balance = await this.token.balanceOf(holder);
        await expectRevert.unspecified(
          this.token.operatorBurn(holder, balance.addn(1), data, operatorData, { from: operator })
        );
      });
    });

    context('when the sender has no tokens', function () {
      removeBalance(holder);

      shouldOperatorBurnTokens(holder, operator, new BN('0'), data, operatorData);

      it('reverts when burning a non-zero amount', async function () {
        await expectRevert.unspecified(
          this.token.operatorBurn(holder, new BN('1'), data, operatorData, { from: operator })
        );
      });

      it('reverts when burning from the zero address', async function () {
        // This is not yet reflected in the spec
        await expectRevert.unspecified(
          this.token.operatorBurn(
            ZERO_ADDRESS, new BN('0'), data, operatorData, { from: operator }
          )
        );
      });
    });
  });
}

function shouldBehaveLikeERC777UnauthorizedOperatorBurn (holder, operator, data, operatorData) {
  describe('operator burn', function () {
    it('reverts', async function () {
      await expectRevert.unspecified(this.token.operatorBurn(holder, new BN('0'), data, operatorData));
    });
  });
}

function shouldDirectSendTokens (from, to, amount, data) {
  shouldSendTokens(from, null, to, amount, data, null);
}

function shouldOperatorSendTokens (from, operator, to, amount, data, operatorData) {
  shouldSendTokens(from, operator, to, amount, data, operatorData);
}

function shouldSendTokens (from, operator, to, amount, data, operatorData) {
  const operatorCall = operator !== null;

  it(`${operatorCall ? 'operator ' : ''}can send an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialFromBalance = await this.token.balanceOf(from);
    const initialToBalance = await this.token.balanceOf(to);

    let logs;
    if (!operatorCall) {
      ({ logs } = await this.token.send(to, amount, data, { from }));
      expectEvent.inLogs(logs, 'Sent', {
        operator: from,
        from,
        to,
        amount,
        data,
        operatorData: null,
      });
    } else {
      ({ logs } = await this.token.operatorSend(from, to, amount, data, operatorData, { from: operator }));
      expectEvent.inLogs(logs, 'Sent', {
        operator,
        from,
        to,
        amount,
        data,
        operatorData,
      });
    }

    expectEvent.inLogs(logs, 'Transfer', {
      from,
      to,
      value: amount,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalFromBalance = await this.token.balanceOf(from);
    const finalToBalance = await this.token.balanceOf(to);

    expect(finalTotalSupply).to.be.bignumber.equal(initialTotalSupply);
    expect(finalToBalance.sub(initialToBalance)).to.be.bignumber.equal(amount);
    expect(finalFromBalance.sub(initialFromBalance)).to.be.bignumber.equal(amount.neg());
  });
}

function shouldDirectBurnTokens (from, amount, data) {
  shouldBurnTokens(from, null, amount, data, null);
}

function shouldOperatorBurnTokens (from, operator, amount, data, operatorData) {
  shouldBurnTokens(from, operator, amount, data, operatorData);
}

function shouldBurnTokens (from, operator, amount, data, operatorData) {
  const operatorCall = operator !== null;

  it(`${operatorCall ? 'operator ' : ''}can burn an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialFromBalance = await this.token.balanceOf(from);

    let logs;
    if (!operatorCall) {
      ({ logs } = await this.token.burn(amount, data, { from }));
      expectEvent.inLogs(logs, 'Burned', {
        operator: from,
        from,
        amount,
        data,
        operatorData: null,
      });
    } else {
      ({ logs } = await this.token.operatorBurn(from, amount, data, operatorData, { from: operator }));
      expectEvent.inLogs(logs, 'Burned', {
        operator,
        from,
        amount,
        data,
        operatorData,
      });
    }

    expectEvent.inLogs(logs, 'Transfer', {
      from,
      to: ZERO_ADDRESS,
      value: amount,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalFromBalance = await this.token.balanceOf(from);

    expect(finalTotalSupply.sub(initialTotalSupply)).to.be.bignumber.equal(amount.neg());
    expect(finalFromBalance.sub(initialFromBalance)).to.be.bignumber.equal(amount.neg());
  });
}

function shouldBehaveLikeERC777InternalMint (recipient, operator, amount, data, operatorData) {
  shouldInternalMintTokens(operator, recipient, new BN('0'), data, operatorData);
  shouldInternalMintTokens(operator, recipient, amount, data, operatorData);

  it('reverts when minting tokens for the zero address', async function () {
    await expectRevert.unspecified(this.token.mintInternal(operator, ZERO_ADDRESS, amount, data, operatorData));
  });
}

function shouldInternalMintTokens (operator, to, amount, data, operatorData) {
  it(`can (internal) mint an amount of ${amount}`, async function () {
    const initialTotalSupply = await this.token.totalSupply();
    const initialToBalance = await this.token.balanceOf(to);

    const { logs } = await this.token.mintInternal(operator, to, amount, data, operatorData);

    expectEvent.inLogs(logs, 'Minted', {
      operator,
      to,
      amount,
      data,
      operatorData,
    });

    expectEvent.inLogs(logs, 'Transfer', {
      from: ZERO_ADDRESS,
      to,
      value: amount,
    });

    const finalTotalSupply = await this.token.totalSupply();
    const finalToBalance = await this.token.balanceOf(to);

    expect(finalTotalSupply.sub(initialTotalSupply)).to.be.bignumber.equal(amount);
    expect(finalToBalance.sub(initialToBalance)).to.be.bignumber.equal(amount);
  });
}

function shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook (operator, amount, data, operatorData) {
  context('when TokensRecipient reverts', function () {
    beforeEach(async function () {
      await this.tokensRecipientImplementer.setShouldRevertReceive(true);
    });

    it('send reverts', async function () {
      await expectRevert.unspecified(sendFromHolder(this.token, this.sender, this.recipient, amount, data));
    });

    it('operatorSend reverts', async function () {
      await expectRevert.unspecified(
        this.token.operatorSend(this.sender, this.recipient, amount, data, operatorData, { from: operator })
      );
    });

    it('mint (internal) reverts', async function () {
      await expectRevert.unspecified(
        this.token.mintInternal(operator, this.recipient, amount, data, operatorData)
      );
    });
  });

  context('when TokensRecipient does not revert', function () {
    beforeEach(async function () {
      await this.tokensRecipientImplementer.setShouldRevertSend(false);
    });

    it('TokensRecipient receives send data and is called after state mutation', async function () {
      const { tx } = await sendFromHolder(this.token, this.sender, this.recipient, amount, data);

      const postSenderBalance = await this.token.balanceOf(this.sender);
      const postRecipientBalance = await this.token.balanceOf(this.recipient);

      await assertTokensReceivedCalled(
        this.token,
        tx,
        this.sender,
        this.sender,
        this.recipient,
        amount,
        data,
        null,
        postSenderBalance,
        postRecipientBalance,
      );
    });

    it('TokensRecipient receives operatorSend data and is called after state mutation', async function () {
      const { tx } = await this.token.operatorSend(
        this.sender, this.recipient, amount, data, operatorData,
        { from: operator },
      );

      const postSenderBalance = await this.token.balanceOf(this.sender);
      const postRecipientBalance = await this.token.balanceOf(this.recipient);

      await assertTokensReceivedCalled(
        this.token,
        tx,
        operator,
        this.sender,
        this.recipient,
        amount,
        data,
        operatorData,
        postSenderBalance,
        postRecipientBalance,
      );
    });

    it('TokensRecipient receives mint (internal) data and is called after state mutation', async function () {
      const { tx } = await this.token.mintInternal(
        operator, this.recipient, amount, data, operatorData,
      );

      const postRecipientBalance = await this.token.balanceOf(this.recipient);

      await assertTokensReceivedCalled(
        this.token,
        tx,
        operator,
        ZERO_ADDRESS,
        this.recipient,
        amount,
        data,
        operatorData,
        new BN('0'),
        postRecipientBalance,
      );
    });
  });
}

function shouldBehaveLikeERC777SendBurnWithSendHook (operator, amount, data, operatorData) {
  context('when TokensSender reverts', function () {
    beforeEach(async function () {
      await this.tokensSenderImplementer.setShouldRevertSend(true);
    });

    it('send reverts', async function () {
      await expectRevert.unspecified(sendFromHolder(this.token, this.sender, this.recipient, amount, data));
    });

    it('operatorSend reverts', async function () {
      await expectRevert.unspecified(
        this.token.operatorSend(this.sender, this.recipient, amount, data, operatorData, { from: operator })
      );
    });

    it('burn reverts', async function () {
      await expectRevert.unspecified(burnFromHolder(this.token, this.sender, amount, data));
    });

    it('operatorBurn reverts', async function () {
      await expectRevert.unspecified(
        this.token.operatorBurn(this.sender, amount, data, operatorData, { from: operator })
      );
    });
  });

  context('when TokensSender does not revert', function () {
    beforeEach(async function () {
      await this.tokensSenderImplementer.setShouldRevertSend(false);
    });

    it('TokensSender receives send data and is called before state mutation', async function () {
      const preSenderBalance = await this.token.balanceOf(this.sender);
      const preRecipientBalance = await this.token.balanceOf(this.recipient);

      const { tx } = await sendFromHolder(this.token, this.sender, this.recipient, amount, data);

      await assertTokensToSendCalled(
        this.token,
        tx,
        this.sender,
        this.sender,
        this.recipient,
        amount,
        data,
        null,
        preSenderBalance,
        preRecipientBalance,
      );
    });

    it('TokensSender receives operatorSend data and is called before state mutation', async function () {
      const preSenderBalance = await this.token.balanceOf(this.sender);
      const preRecipientBalance = await this.token.balanceOf(this.recipient);

      const { tx } = await this.token.operatorSend(
        this.sender, this.recipient, amount, data, operatorData,
        { from: operator },
      );

      await assertTokensToSendCalled(
        this.token,
        tx,
        operator,
        this.sender,
        this.recipient,
        amount,
        data,
        operatorData,
        preSenderBalance,
        preRecipientBalance,
      );
    });

    it('TokensSender receives burn data and is called before state mutation', async function () {
      const preSenderBalance = await this.token.balanceOf(this.sender);

      const { tx } = await burnFromHolder(this.token, this.sender, amount, data, { from: this.sender });

      await assertTokensToSendCalled(
        this.token, tx, this.sender, this.sender, ZERO_ADDRESS, amount, data, null, preSenderBalance
      );
    });

    it('TokensSender receives operatorBurn data and is called before state mutation', async function () {
      const preSenderBalance = await this.token.balanceOf(this.sender);

      const { tx } = await this.token.operatorBurn(this.sender, amount, data, operatorData, { from: operator });

      await assertTokensToSendCalled(
        this.token, tx, operator, this.sender, ZERO_ADDRESS, amount, data, operatorData, preSenderBalance
      );
    });
  });
}

function removeBalance (holder) {
  beforeEach(async function () {
    await this.token.burn(await this.token.balanceOf(holder), '0x', { from: holder });
    expect(await this.token.balanceOf(holder)).to.be.bignumber.equal('0');
  });
}

async function assertTokensReceivedCalled (token, txHash, operator, from, to, amount, data, operatorData, fromBalance,
  toBalance = '0') {
  await expectEvent.inTransaction(txHash, ERC777SenderRecipientMock, 'TokensReceivedCalled', {
    operator, from, to, amount, data, operatorData, token: token.address, fromBalance, toBalance,
  });
}

async function assertTokensToSendCalled (token, txHash, operator, from, to, amount, data, operatorData, fromBalance,
  toBalance = '0') {
  await expectEvent.inTransaction(txHash, ERC777SenderRecipientMock, 'TokensToSendCalled', {
    operator, from, to, amount, data, operatorData, token: token.address, fromBalance, toBalance,
  });
}

async function sendFromHolder (token, holder, to, amount, data) {
  if ((await web3.eth.getCode(holder)).length <= '0x'.length) {
    return token.send(to, amount, data, { from: holder });
  } else {
    // assume holder is ERC777SenderRecipientMock contract
    return (await ERC777SenderRecipientMock.at(holder)).send(token.address, to, amount, data);
  }
}

async function burnFromHolder (token, holder, amount, data) {
  if ((await web3.eth.getCode(holder)).length <= '0x'.length) {
    return token.burn(amount, data, { from: holder });
  } else {
    // assume holder is ERC777SenderRecipientMock contract
    return (await ERC777SenderRecipientMock.at(holder)).burn(token.address, amount, data);
  }
}

module.exports = {
  shouldBehaveLikeERC777DirectSendBurn,
  shouldBehaveLikeERC777OperatorSendBurn,
  shouldBehaveLikeERC777UnauthorizedOperatorSendBurn,
  shouldBehaveLikeERC777InternalMint,
  shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook,
  shouldBehaveLikeERC777SendBurnWithSendHook,
};
