const { BN, constants, expectEvent, shouldFail, singletons } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const ERC777 = artifacts.require('ERC777Mock');

contract.only('ERC777', function ([_, registryFunder, initialHolder, defaultOperatorA, defaultOperatorB, operator, anyone]) {
  const initialSupply = new BN('10000');
  const name = 'ERC777Test';
  const symbol = '777T';
  const data = web3.utils.sha3('OZ777TestData');

  const defaultOperators = [defaultOperatorA, defaultOperatorB];

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
        for (let operator of defaultOperators) {
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

    function assertSendSuccess(from, to, amount, data) {
      it(`can send an amount of ${amount}`, async function () {
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

        const finalFromBalance = await this.token.balanceOf(from);
        const finalToBalance = await this.token.balanceOf(to);

        finalToBalance.sub(initialToBalance).should.be.bignumber.equal(amount);
        finalFromBalance.sub(initialFromBalance).should.be.bignumber.equal(amount.neg());
      });
    }

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

        assertSendSuccess(from, initialHolder, new BN('0'), data);

        it('reverts when sending a non-zero amount', async function () {
          await shouldFail.reverting(this.token.send(initialHolder, new BN('1'), data, { from }));
        });
      });

      context('when the sender has tokens', async function () {
        const from = initialHolder;

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
    });
  });

  context('with no default operators', function () {
    beforeEach(async function () {
      await shouldFail.reverting(ERC777.new(initialHolder, initialSupply, name, symbol, 1, []));
    });
  });
});
