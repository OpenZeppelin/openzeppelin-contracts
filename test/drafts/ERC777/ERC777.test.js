const { BN, expectEvent, shouldFail, singletons } = require('openzeppelin-test-helpers');

const {
  shouldBehaveLikeERC777DirectSend,
  shouldBehaveLikeERC777OperatorSend,
  shouldBehaveLikeERC777UnauthorizedOperatorSend,
  shouldBehaveLikeERC777DirectBurn,
  shouldBehaveLikeERC777OperatorBurn,
  shouldDirectSendTokens,
} = require('./ERC777.behavior');

const ERC777 = artifacts.require('ERC777Mock');

contract('ERC777', function ([
  _, registryFunder, holder, defaultOperatorA, defaultOperatorB, newOperator, anyone,
]) {
  const initialSupply = new BN('10000');
  const name = 'ERC777Test';
  const symbol = '777T';
  const data = web3.utils.sha3('OZ777TestData');
  const operatorData = web3.utils.sha3('OZ777TestOperatorData');

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

  before(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });

  it('reverts with a granularity of zero', async function () {
    await shouldFail.reverting(ERC777.new(holder, initialSupply, name, symbol, 0, []));
  });

  context('with a granularity of one', function () {
    const granularity = new BN('1');

    context('with default operators', function () {
      beforeEach(async function () {
        this.token = await ERC777.new(holder, initialSupply, name, symbol, 1, defaultOperators);
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

      describe('send', function () {
        shouldBehaveLikeERC777DirectSend(holder, anyone, data);

        context('with self operator', function () {
          shouldBehaveLikeERC777OperatorSend(holder, anyone, holder, data, operatorData);
        });

        context('with first default operator', function () {
          shouldBehaveLikeERC777OperatorSend(holder, anyone, defaultOperatorA, data, operatorData);
        });

        context('with second default operator', function () {
          shouldBehaveLikeERC777OperatorSend(holder, anyone, defaultOperatorB, data, operatorData);
        });

        context('before authorizing a new operator', function () {
          shouldBehaveLikeERC777UnauthorizedOperatorSend(holder, anyone, newOperator, data, operatorData);
        });

        context('with new authorized operator', function () {
          beforeEach(async function () {
            await this.token.authorizeOperator(newOperator, { from: holder });
          });

          shouldBehaveLikeERC777OperatorSend(holder, anyone, newOperator, data, operatorData);

          context('with revoked operator', function () {
            beforeEach(async function () {
              await this.token.revokeOperator(newOperator, { from: holder });
            });

            shouldBehaveLikeERC777UnauthorizedOperatorSend(holder, anyone, newOperator, data, operatorData);
          });
        });
      });

      describe('burn', function () {
        shouldBehaveLikeERC777DirectBurn(holder, data);

        context('with self operator', function () {
          shouldBehaveLikeERC777OperatorBurn(holder, holder, data, operatorData);
        });

        context('with first default operator', function () {
          shouldBehaveLikeERC777OperatorBurn(holder, defaultOperatorA, data, operatorData);
        });

        context('with second default operator', function () {
          shouldBehaveLikeERC777OperatorBurn(holder, defaultOperatorB, data, operatorData);
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
    });

    context('with no default operators', function () {
      beforeEach(async function () {
        this.token = await ERC777.new(holder, initialSupply, name, symbol, 1, []);
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
