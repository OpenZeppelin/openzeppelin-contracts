const { BN, constants, shouldFail, singletons } = require('openzeppelin-test-helpers');

const ERC777 = artifacts.require('ERC777');

contract.only('ERC777', function ([_, registryFunder, initialHolder, defaultOperatorA, defaultOperatorB, operator, anyone]) {
  const initialSupply = new BN('10000');
  const name = 'ERC777Test';
  const symbol = '777T';

  before(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
  });

  it('reverts with a granularity of zero', async function () {
    await shouldFail.reverting(ERC777.new(name, symbol, 0, []));
  });

  context('with default operators', function () {
    beforeEach(async function () {
      this.token = await ERC777.new(name, symbol, 1, [defaultOperatorA, defaultOperatorB]);
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

      it('is registered in the registry', async function () {
        (await this.erc1820.getInterfaceImplementer(this.token.address, )).should.equal(this.token.address);
      });
    });
  });

  context('with no default operators', function () {
    beforeEach(async function () {
      await shouldFail.reverting(ERC777.new(name, symbol, 1, []));
    });
  });
});
