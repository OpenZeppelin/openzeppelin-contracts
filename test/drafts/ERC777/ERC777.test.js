const { BN, shouldFail, singletons } = require('openzeppelin-test-helpers');

const {
  shouldBehaveLikeERC777DirectSend,
  shouldBehaveLikeERC777OperatorSend,
  shouldBehaveLikeERC777DirectBurn,
  shouldBehaveLikeERC777OperatorBurn,
  shouldDirectSendTokens,
} = require('./ERC777.behavior');

const ERC777 = artifacts.require('ERC777Mock');

contract('ERC777', function ([
  _, registryFunder, initialHolder, nonHolder, defaultOperatorA, defaultOperatorB, newOperator, anyone,
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
      shouldBehaveLikeERC777DirectSend(initialHolder, nonHolder, anyone, data);

      context('with first default operator', function () {
        shouldBehaveLikeERC777OperatorSend(initialHolder, nonHolder, anyone, defaultOperatorA, data, operatorData);
      });

      context('with second default operator', function () {
        shouldBehaveLikeERC777OperatorSend(initialHolder, nonHolder, anyone, defaultOperatorB, data, operatorData);
      });
    });

    describe('burn', function () {
      shouldBehaveLikeERC777DirectBurn(initialHolder, nonHolder, data);

      context('with first default operator', function () {
        shouldBehaveLikeERC777OperatorBurn(initialHolder, nonHolder, defaultOperatorA, data, operatorData);
      });

      context('with second default operator', function () {
        shouldBehaveLikeERC777OperatorBurn(initialHolder, nonHolder, defaultOperatorB, data, operatorData);
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

      shouldDirectSendTokens(from, anyone, new BN('0'), data);
      shouldDirectSendTokens(from, anyone, granularity, data);
      shouldDirectSendTokens(from, anyone, granularity.muln(2), data);

      it('reverts when sending an amount non-multiple of the granularity', async function () {
        await shouldFail.reverting(this.token.send(anyone, granularity.subn(1), data, { from }));
      });
    });
  });
});
