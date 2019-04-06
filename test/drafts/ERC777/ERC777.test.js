const { BN, constants, expectEvent, shouldFail, singletons } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const {
  shouldBehaveLikeERC777DirectSendBurn,
  shouldBehaveLikeERC777OperatorSendBurn,
  shouldBehaveLikeERC777UnauthorizedOperatorSendBurn,
  shouldDirectSendTokens,
} = require('./ERC777.behavior');

const ERC777 = artifacts.require('ERC777Mock');
const ERC777SenderMock = artifacts.require('ERC777SenderMock');

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

  it('reverts with a granularity of zero', async function () {
    await shouldFail.reverting(ERC777.new(holder, initialSupply, name, symbol, 0, []));
  });

  context('with a granularity of one', function () {
    const granularity = new BN('1');

    context('with default operators', function () {
      beforeEach(async function () {
        this.token = await ERC777.new(holder, initialSupply, name, symbol, granularity, defaultOperators);
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

        it('returns the granularity', async function () {
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

      describe('send/burn', function () {
        context('with no ERC777TokensSender and no ERC777TokensRecipient implementers', function () {
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

      describe('tokensToSend hook', function () {
        context('with ERC777TokensSender implementer', function () {
          async function assertTokensToSendCalled (token, txHash, operator, from, to, amount, data, operatorData, fromBalance, toBalance='0') {
            await expectEvent.inTransaction(txHash, ERC777SenderMock, 'TokensToSendCalled', {
              operator, from, to, amount, data, operatorData, token: token.address, fromBalance, toBalance
            });
          }

          async function sendFromHolder(token, holder, to, amount, data) {
            if ((await web3.eth.getCode(holder)).length <= '0x'.length) {
              return token.send(to, amount, data, { from: holder });

            } else {
              // assume holder is ERC777SenderMock contract
              return (await ERC777SenderMock.at(holder)).send(token.address, to, amount, data);
            }
          }

          async function burnFromHolder(token, holder, amount, data) {
            if ((await web3.eth.getCode(holder)).length <= '0x'.length) {
              return token.burn(amount, data, { from: holder });

            } else {
              // assume holder is ERC777SenderMock contract
              return (await ERC777SenderMock.at(holder)).burn(token.address, amount, data);
            }
          }

          context('with a contract as implementer for an externally owned account', function () {
            const amount = new BN('1');
            const recipient = anyone;
            const operator = defaultOperatorA;
            const sender = holder;

            beforeEach(async function () {
              this.tokensSenderImplementer = await ERC777SenderMock.new(holder);
              await this.erc1820.setInterfaceImplementer(holder, web3.utils.soliditySha3('ERC777TokensSender'), this.tokensSenderImplementer.address, { from: holder });
            });

            context('when TokensSender reverts', function () {
              beforeEach(async function () {
                await this.tokensSenderImplementer.setShouldRevert(true);
              });

              it('send reverts', async function () {
                await shouldFail.reverting(sendFromHolder(this.token, sender, recipient, amount, data));
              });

              it('operatorSend reverts', async function () {
                await shouldFail.reverting(
                  this.token.operatorSend(sender, recipient, amount, data, operatorData, { from: operator })
                );
              });

              it('burn reverts', async function () {
                await shouldFail.reverting(burnFromHolder(this.token, sender, amount, data));
              });

              it('operatorBurn reverts', async function () {
                await shouldFail.reverting(
                  this.token.operatorBurn(sender, amount, data, operatorData, { from: operator })
                );
              });
            });

            context('when TokensSender does not revert', function () {
              beforeEach(async function () {
                await this.tokensSenderImplementer.setShouldRevert(false);
              });

              it('TokensSender receives send data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);
                const preRecipientBalance = await this.token.balanceOf(recipient);

                const { tx } = await sendFromHolder(this.token, sender, recipient, amount, data);

                await assertTokensToSendCalled(
                  this.token, tx, sender, sender, recipient, amount, data, null, preHolderBalance, preRecipientBalance
                );
              });

              it('TokensSender receives operatorSend data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);
                const preRecipientBalance = await this.token.balanceOf(recipient);

                const { tx } = await this.token.operatorSend(sender, recipient, amount, data, operatorData, { from: operator });

                await assertTokensToSendCalled(
                  this.token, tx, operator, sender, recipient, amount, data, operatorData, preHolderBalance, preRecipientBalance
                );
              });

              it('TokensSender receives burn data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);

                const { tx } = await burnFromHolder(this.token, sender, amount, data, { from: sender });

                await assertTokensToSendCalled(
                  this.token, tx, sender, sender, ZERO_ADDRESS, amount, data, null, preHolderBalance
                );
              });

              it('TokensSender receives operatorBurn data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);

                const { tx } = await this.token.operatorBurn(sender, amount, data, operatorData, { from: operator });

                await assertTokensToSendCalled(
                  this.token, tx, operator, sender, ZERO_ADDRESS, amount, data, operatorData, preHolderBalance
                );
              });
            });
          });

          context('with a contract as implementer for itself', function () {
            const amount = new BN('1');
            const recipient = anyone;
            const operator = defaultOperatorA;
            let sender;

            beforeEach(async function () {
              this.tokensSenderImplementer = await ERC777SenderMock.new(ZERO_ADDRESS);

              sender = this.tokensSenderImplementer.address;
              await this.token.send(sender, amount, data, { from: holder });
            });

            context('when TokensSender reverts', function () {
              beforeEach(async function () {
                await this.tokensSenderImplementer.setShouldRevert(true);
              });

              it('send reverts', async function () {
                await shouldFail.reverting(sendFromHolder(this.token, sender, recipient, amount, data));
              });

              it('operatorSend reverts', async function () {
                await shouldFail.reverting(
                  this.token.operatorSend(sender, recipient, amount, data, operatorData, { from: operator })
                );
              });

              it('burn reverts', async function () {
                await shouldFail.reverting(burnFromHolder(this.token, sender, amount, data));
              });

              it('operatorBurn reverts', async function () {
                await shouldFail.reverting(
                  this.token.operatorBurn(sender, amount, data, operatorData, { from: operator })
                );
              });
            });

            context('when TokensSender does not revert', function () {
              beforeEach(async function () {
                await this.tokensSenderImplementer.setShouldRevert(false);
              });

              it('TokensSender receives send data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);
                const preRecipientBalance = await this.token.balanceOf(recipient);

                const { tx } = await sendFromHolder(this.token, sender, recipient, amount, data);

                await assertTokensToSendCalled(
                  this.token, tx, sender, sender, recipient, amount, data, null, preHolderBalance, preRecipientBalance
                );
              });

              it('TokensSender receives operatorSend data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);
                const preRecipientBalance = await this.token.balanceOf(recipient);

                const { tx } = await this.token.operatorSend(sender, recipient, amount, data, operatorData, { from: operator });

                await assertTokensToSendCalled(
                  this.token, tx, operator, sender, recipient, amount, data, operatorData, preHolderBalance, preRecipientBalance
                );
              });

              it('TokensSender receives burn data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);

                const { tx } = await burnFromHolder(this.token, sender, amount, data, { from: sender });

                await assertTokensToSendCalled(
                  this.token, tx, sender, sender, ZERO_ADDRESS, amount, data, null, preHolderBalance
                );
              });

              it('TokensSender receives operatorBurn data and is called before state mutation', async function () {
                const preHolderBalance = await this.token.balanceOf(sender);

                const { tx } = await this.token.operatorBurn(sender, amount, data, operatorData, { from: operator });

                await assertTokensToSendCalled(
                  this.token, tx, operator, sender, ZERO_ADDRESS, amount, data, operatorData, preHolderBalance
                );
              });
            });
          });
        });
      });
    });

    context('with no default operators', function () {
      beforeEach(async function () {
        this.token = await ERC777.new(holder, initialSupply, name, symbol, granularity, []);
      });

      it('default operators list is empty', async function () {
        (await this.token.defaultOperators()).should.deep.equal([]);
      });
    });
  });

  context('with granularity larger than 1', function () {
    const granularity = new BN('4');

    beforeEach(async function () {
      initialSupply.mod(granularity).should.be.bignumber.equal('0');

      this.token = await ERC777.new(holder, initialSupply, name, symbol, granularity, defaultOperators);
    });

    context('when the sender has tokens', function () {
      const from = holder;

      shouldDirectSendTokens(from, anyone, new BN('0'), data);
      shouldDirectSendTokens(from, anyone, granularity, data);
      shouldDirectSendTokens(from, anyone, granularity.muln(2), data);

      it('reverts when sending an amount non-multiple of the granularity', async function () {
        await shouldFail.reverting(this.token.send(anyone, granularity.subn(1), data, { from }));
      });
    });
  });
});
