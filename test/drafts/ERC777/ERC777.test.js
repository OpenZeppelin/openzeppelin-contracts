const { BN, constants, expectEvent, shouldFail, singletons } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const ERC777 = artifacts.require('ERC777Mock');

contract.only('ERC777', function ([_, registryFunder, initialHolder, defaultOperatorA, defaultOperatorB, newOperator, anyone]) {
  const initialSupply = new BN('10000');
  const name = 'ERC777Test';
  const symbol = '777T';
  const data = web3.utils.sha3('OZ777TestData');
  const operatorData = web3.utils.sha3('OZ777TestOperatorData');

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

  function assertSendSuccess (from, to, amount, data) {
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

  function assertOperatorSendSuccess (from, operator, to, amount, data, operatorData) {
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

  function assertBurnSuccess (from, amount, data) {
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

  function assertOperatorBurnSuccess (from, operator, amount, data, operatorData) {
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

  before(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });

  it('reverts with a granularity of zero', async function () {
    await shouldFail.reverting(ERC777.new(initialHolder, initialSupply, name, symbol, 0, []));
  });

  context('with default operators', function () {
    beforeEach(async function () {
      this.token = await ERC777.new(initialHolder, initialSupply, name, symbol, 1, defaultOperators);
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
          (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply);
        });
      });
    });

    describe('send', function () {
      context('when the sender has no tokens', async function () {
        const from = anyone;

        describe('direct send', function () {
          assertSendSuccess(from, initialHolder, new BN('0'), data);

          it('reverts when sending a non-zero amount', async function () {
            await shouldFail.reverting(this.token.send(initialHolder, new BN('1'), data, { from }));
          });
        });

        describe('operator send', function () {
          assertOperatorSendSuccess(from, defaultOperatorA, initialHolder, new BN('0'), data, operatorData);

          it('reverts when sending a non-zero amount', async function () {
            await shouldFail.reverting(
              this.token.operatorSend(from, initialHolder, new BN('1'), data, operatorData, { from: defaultOperatorA })
            );
          });
        });
      });

      context('when the sender has tokens', async function () {
        const from = initialHolder;

        describe('direct send', function () {
          assertSendSuccess(from, anyone, new BN('0'), data);
          assertSendSuccess(from, anyone, new BN('1'), data);

          it('reverts when sending more than the balance', async function () {
            const balance = await this.token.balanceOf(from);
            await shouldFail.reverting(this.token.send(anyone, balance.addn(1), data, { from }));
          });

          it('reverts when sending to the zero address', async function () {
            await shouldFail.reverting(this.token.send(ZERO_ADDRESS, new BN('1'), data, { from }));
          });
        });

        describe('operator send', function () {
          assertOperatorSendSuccess(from, defaultOperatorA, anyone, new BN('0'), data, operatorData);
          assertOperatorSendSuccess(from, defaultOperatorB, anyone, new BN('1'), data, operatorData);

          it('reverts when sending more than the balance', async function () {
            const balance = await this.token.balanceOf(from);
            await shouldFail.reverting(
              this.token.operatorSend(from, anyone, balance.addn(1), data, operatorData, { from: defaultOperatorA })
            );
          });

          it('reverts when sending to the zero address', async function () {
            await shouldFail.reverting(
              this.token.operatorSend(
                from, ZERO_ADDRESS, new BN('1'), data, operatorData, { from: defaultOperatorA }
              )
            );
          });
        });
      });
    });

    describe('burn', function () {
      context('when the sender has no tokens', async function () {
        const from = anyone;

        describe('direct burn', function () {
          assertBurnSuccess(from, new BN('0'), data);

          it('reverts when burning a non-zero amount', async function () {
            await shouldFail.reverting(this.token.burn(new BN('1'), data, { from }));
          });
        });

        describe('operator burn', function () {
          assertOperatorBurnSuccess(from, defaultOperatorA, new BN('0'), data, operatorData);

          it('reverts when burning a non-zero amount', async function () {
            await shouldFail.reverting(
              this.token.operatorBurn(from, new BN('1'), data, operatorData, { from: defaultOperatorA })
            );
          });
        });
      });

      context('when the sender has tokens', async function () {
        const from = initialHolder;

        describe('direct burn', function () {
          assertBurnSuccess(from, new BN('0'), data);
          assertBurnSuccess(from, new BN('1'), data);

          it('reverts when burning more than the balance', async function () {
            const balance = await this.token.balanceOf(from);
            await shouldFail.reverting(this.token.burn(balance.addn(1), data, { from }));
          });
        });

        describe('operator burn', function () {
          assertOperatorBurnSuccess(from, defaultOperatorA, new BN('0'), data, operatorData);
          assertOperatorBurnSuccess(from, defaultOperatorB, new BN('1'), data, operatorData);

          it('reverts when burning more than the balance', async function () {
            const balance = await this.token.balanceOf(from);
            await shouldFail.reverting(
              this.token.operatorBurn(from, balance.addn(1), data, operatorData, { from: defaultOperatorA })
            );
          });
        });
      });
    });
  });

  context('with no default operators', function () {
    beforeEach(async function () {
      await shouldFail.reverting(ERC777.new(initialHolder, initialSupply, name, symbol, 1, []));
    });
  });

  context('with granularity larger than 1', function () {
    const granularity = new BN('4');

    beforeEach(async function () {
      initialSupply.mod(granularity).should.be.bignumber.equal('0');

      this.token = await ERC777.new(initialHolder, initialSupply, name, symbol, granularity, defaultOperators);
    });

    context('when the sender has tokens', function () {
      const from = initialHolder;

      assertSendSuccess(from, anyone, new BN('0'), data);
      assertSendSuccess(from, anyone, granularity, data);
      assertSendSuccess(from, anyone, granularity.muln(2), data);

      it('reverts when sending an amount non-multiple of the granularity', async function () {
        await shouldFail.reverting(this.token.send(anyone, granularity.subn(1), data, { from }));
      });
    });
  });
});
