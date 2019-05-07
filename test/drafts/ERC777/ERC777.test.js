const { BN, expectEvent, shouldFail, singletons } = require('openzeppelin-test-helpers');

const {
  shouldBehaveLikeERC777DirectSendBurn,
  shouldBehaveLikeERC777OperatorSendBurn,
  shouldBehaveLikeERC777UnauthorizedOperatorSendBurn,
  shouldBehaveLikeERC777InternalMint,
  shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook,
  shouldBehaveLikeERC777SendBurnWithSendHook,
} = require('./ERC777.behavior');

const ERC777 = artifacts.require('ERC777Mock');
const ERC777SenderRecipientMock = artifacts.require('ERC777SenderRecipientMock');

contract('ERC777', function ([
  _, registryFunder, holder, defaultOperatorA, defaultOperatorB, newOperator, anyone,
]) {
  const initialSupply = new BN('10000');
  const name = 'ERC777Test';
  const symbol = '777T';
  const data = web3.utils.sha3('OZ777TestData');
  const operatorData = web3.utils.sha3('OZ777TestOperatorData');

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });

  context('with default operators', function () {
    beforeEach(async function () {
      this.token = await ERC777.new(holder, initialSupply, name, symbol, defaultOperators);
    });

    it.skip('does not emit AuthorizedOperator events for default operators', async function () {
      expectEvent.not.inConstructor(this.token, 'AuthorizedOperator'); // This helper needs to be implemented
    });

    describe('basic information', function () {
      it('returns the name', async function () {
        (await this.token.name()).should.equal(name);
      });

      it('returns the symbol', async function () {
        (await this.token.symbol()).should.equal(symbol);
      });

      it('has a granularity of 1', async function () {
        (await this.token.granularity()).should.be.bignumber.equal('1');
      });

      it('returns the default operators', async function () {
        (await this.token.defaultOperators()).should.deep.equal(defaultOperators);
      });

      it('default operators are operators for all accounts', async function () {
        for (const operator of defaultOperators) {
          (await this.token.isOperatorFor(operator, anyone)).should.equal(true);
        }
      });

      it('returns thte total supply', async function () {
        (await this.token.totalSupply()).should.be.bignumber.equal(initialSupply);
      });

      it('is registered in the registry', async function () {
        (await this.erc1820.getInterfaceImplementer(this.token.address, web3.utils.soliditySha3('ERC777Token')))
          .should.equal(this.token.address);
      });
    });

    describe('balanceOf', function () {
      context('for an account with no tokens', function () {
        it('returns zero', async function () {
          (await this.token.balanceOf(anyone)).should.be.bignumber.equal('0');
        });
      });

      context('for an account with tokens', function () {
        it('returns their balance', async function () {
          (await this.token.balanceOf(holder)).should.be.bignumber.equal(initialSupply);
        });
      });
    });

    context('with no ERC777TokensSender and no ERC777TokensRecipient implementers', function () {
      describe('send/burn', function () {
        shouldBehaveLikeERC777DirectSendBurn(holder, anyone, data);

        context('with self operator', function () {
          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, holder, data, operatorData);
        });

        context('with first default operator', function () {
          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, defaultOperatorA, data, operatorData);
        });

        context('with second default operator', function () {
          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, defaultOperatorB, data, operatorData);
        });

        context('before authorizing a new operator', function () {
          shouldBehaveLikeERC777UnauthorizedOperatorSendBurn(holder, anyone, newOperator, data, operatorData);
        });

        context('with new authorized operator', function () {
          beforeEach(async function () {
            await this.token.authorizeOperator(newOperator, { from: holder });
          });

          shouldBehaveLikeERC777OperatorSendBurn(holder, anyone, newOperator, data, operatorData);

          context('with revoked operator', function () {
            beforeEach(async function () {
              await this.token.revokeOperator(newOperator, { from: holder });
            });

            shouldBehaveLikeERC777UnauthorizedOperatorSendBurn(holder, anyone, newOperator, data, operatorData);
          });
        });
      });

      describe('mint (internal)', function () {
        const to = anyone;
        const amount = new BN('5');

        context('with default operator', function () {
          const operator = defaultOperatorA;

          shouldBehaveLikeERC777InternalMint(to, operator, amount, data, operatorData);
        });

        context('with non operator', function () {
          const operator = newOperator;

          shouldBehaveLikeERC777InternalMint(to, operator, amount, data, operatorData);
        });
      });
    });

    describe('operator management', function () {
      it('accounts are their own operator', async function () {
        (await this.token.isOperatorFor(holder, holder)).should.equal(true);
      });

      it('reverts when self-authorizing', async function () {
        await shouldFail.reverting(this.token.authorizeOperator(holder, { from: holder }));
      });

      it('reverts when self-revoking', async function () {
        await shouldFail.reverting(this.token.revokeOperator(holder, { from: holder }));
      });

      it('non-operators can be revoked', async function () {
        (await this.token.isOperatorFor(newOperator, holder)).should.equal(false);

        const { logs } = await this.token.revokeOperator(newOperator, { from: holder });
        expectEvent.inLogs(logs, 'RevokedOperator', { operator: newOperator, tokenHolder: holder });

        (await this.token.isOperatorFor(newOperator, holder)).should.equal(false);
      });

      it('non-operators can be authorized', async function () {
        (await this.token.isOperatorFor(newOperator, holder)).should.equal(false);

        const { logs } = await this.token.authorizeOperator(newOperator, { from: holder });
        expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: newOperator, tokenHolder: holder });

        (await this.token.isOperatorFor(newOperator, holder)).should.equal(true);
      });

      describe('new operators', function () {
        beforeEach(async function () {
          await this.token.authorizeOperator(newOperator, { from: holder });
        });

        it('are not added to the default operators list', async function () {
          (await this.token.defaultOperators()).should.deep.equal(defaultOperators);
        });

        it('can be re-authorized', async function () {
          const { logs } = await this.token.authorizeOperator(newOperator, { from: holder });
          expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: newOperator, tokenHolder: holder });

          (await this.token.isOperatorFor(newOperator, holder)).should.equal(true);
        });

        it('can be revoked', async function () {
          const { logs } = await this.token.revokeOperator(newOperator, { from: holder });
          expectEvent.inLogs(logs, 'RevokedOperator', { operator: newOperator, tokenHolder: holder });

          (await this.token.isOperatorFor(newOperator, holder)).should.equal(false);
        });
      });

      describe('default operators', function () {
        it('can be re-authorized', async function () {
          const { logs } = await this.token.authorizeOperator(defaultOperatorA, { from: holder });
          expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: defaultOperatorA, tokenHolder: holder });

          (await this.token.isOperatorFor(defaultOperatorA, holder)).should.equal(true);
        });

        it('can be revoked', async function () {
          const { logs } = await this.token.revokeOperator(defaultOperatorA, { from: holder });
          expectEvent.inLogs(logs, 'RevokedOperator', { operator: defaultOperatorA, tokenHolder: holder });

          (await this.token.isOperatorFor(defaultOperatorA, holder)).should.equal(false);
        });

        it('cannot be revoked for themselves', async function () {
          await shouldFail.reverting(this.token.revokeOperator(defaultOperatorA, { from: defaultOperatorA }));
        });

        context('with revoked default operator', function () {
          beforeEach(async function () {
            await this.token.revokeOperator(defaultOperatorA, { from: holder });
          });

          it('default operator is not revoked for other holders', async function () {
            (await this.token.isOperatorFor(defaultOperatorA, anyone)).should.equal(true);
          });

          it('other default operators are not revoked', async function () {
            (await this.token.isOperatorFor(defaultOperatorB, holder)).should.equal(true);
          });

          it('default operators list is not modified', async function () {
            (await this.token.defaultOperators()).should.deep.equal(defaultOperators);
          });

          it('revoked default operator can be re-authorized', async function () {
            const { logs } = await this.token.authorizeOperator(defaultOperatorA, { from: holder });
            expectEvent.inLogs(logs, 'AuthorizedOperator', { operator: defaultOperatorA, tokenHolder: holder });

            (await this.token.isOperatorFor(defaultOperatorA, holder)).should.equal(true);
          });
        });
      });
    });

    describe('send and receive hooks', function () {
      const amount = new BN('1');
      const operator = defaultOperatorA;
      // sender and recipient are stored inside 'this', since in some tests their addresses are determined dynamically

      describe('tokensReceived', function () {
        beforeEach(function () {
          this.sender = holder;
        });

        context('with no ERC777TokensRecipient implementer', function () {
          context('with contract recipient', function () {
            beforeEach(async function () {
              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              this.recipient = this.tokensRecipientImplementer.address;

              // Note that tokensRecipientImplementer doesn't implement the recipient interface for the recipient
            });

            it('send reverts', async function () {
              await shouldFail.reverting(this.token.send(this.recipient, amount, data));
            });

            it('operatorSend reverts', async function () {
              await shouldFail.reverting(
                this.token.operatorSend(this.sender, this.recipient, amount, data, operatorData, { from: operator })
              );
            });

            it('mint (internal) reverts', async function () {
              await shouldFail.reverting(
                this.token.mintInternal(operator, this.recipient, amount, data, operatorData)
              );
            });
          });
        });

        context('with ERC777TokensRecipient implementer', function () {
          context('with contract as implementer for an externally owned account', function () {
            beforeEach(async function () {
              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              this.recipient = anyone;

              await this.tokensRecipientImplementer.recipientFor(this.recipient);

              await this.erc1820.setInterfaceImplementer(
                this.recipient,
                web3.utils.soliditySha3('ERC777TokensRecipient'), this.tokensRecipientImplementer.address,
                { from: this.recipient },
              );
            });

            shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
          });

          context('with contract as implementer for another contract', function () {
            beforeEach(async function () {
              this.recipientContract = await ERC777SenderRecipientMock.new();
              this.recipient = this.recipientContract.address;

              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              await this.tokensRecipientImplementer.recipientFor(this.recipient);
              await this.recipientContract.registerRecipient(this.tokensRecipientImplementer.address);
            });

            shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
          });

          context('with contract as implementer for itself', function () {
            beforeEach(async function () {
              this.tokensRecipientImplementer = await ERC777SenderRecipientMock.new();
              this.recipient = this.tokensRecipientImplementer.address;

              await this.tokensRecipientImplementer.recipientFor(this.recipient);
            });

            shouldBehaveLikeERC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
          });
        });
      });

      describe('tokensToSend', function () {
        beforeEach(function () {
          this.recipient = anyone;
        });

        context('with a contract as implementer for an externally owned account', function () {
          beforeEach(async function () {
            this.tokensSenderImplementer = await ERC777SenderRecipientMock.new();
            this.sender = holder;

            await this.tokensSenderImplementer.senderFor(this.sender);

            await this.erc1820.setInterfaceImplementer(
              this.sender,
              web3.utils.soliditySha3('ERC777TokensSender'), this.tokensSenderImplementer.address,
              { from: this.sender },
            );
          });

          shouldBehaveLikeERC777SendBurnWithSendHook(operator, amount, data, operatorData);
        });

        context('with contract as implementer for another contract', function () {
          beforeEach(async function () {
            this.senderContract = await ERC777SenderRecipientMock.new();
            this.sender = this.senderContract.address;

            this.tokensSenderImplementer = await ERC777SenderRecipientMock.new();
            await this.tokensSenderImplementer.senderFor(this.sender);
            await this.senderContract.registerSender(this.tokensSenderImplementer.address);

            // For the contract to be able to receive tokens (that it can later send), it must also implement the
            // recipient interface.

            await this.senderContract.recipientFor(this.sender);
            await this.token.send(this.sender, amount, data, { from: holder });
          });

          shouldBehaveLikeERC777SendBurnWithSendHook(operator, amount, data, operatorData);
        });

        context('with a contract as implementer for itself', function () {
          beforeEach(async function () {
            this.tokensSenderImplementer = await ERC777SenderRecipientMock.new();
            this.sender = this.tokensSenderImplementer.address;

            await this.tokensSenderImplementer.senderFor(this.sender);

            // For the contract to be able to receive tokens (that it can later send), it must also implement the
            // recipient interface.

            await this.tokensSenderImplementer.recipientFor(this.sender);
            await this.token.send(this.sender, amount, data, { from: holder });
          });

          shouldBehaveLikeERC777SendBurnWithSendHook(operator, amount, data, operatorData);
        });
      });
    });
  });

  context('with no default operators', function () {
    beforeEach(async function () {
      this.token = await ERC777.new(holder, initialSupply, name, symbol, []);
    });

    it('default operators list is empty', async function () {
      (await this.token.defaultOperators()).should.deep.equal([]);
    });
  });
});
