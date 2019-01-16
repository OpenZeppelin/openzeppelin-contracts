const { constants, expectEvent } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const SimpleToken = artifacts.require('SimpleToken');

contract('SimpleToken', function ([_, creator]) {
  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: creator });
  });

  it('has a name', async function () {
    (await this.token.name()).should.equal('SimpleToken');
  });

  it('has a symbol', async function () {
    (await this.token.symbol()).should.equal('SIM');
  });

  it('has 18 decimals', async function () {
    (await this.token.decimals()).should.be.bignumber.equal('18');
  });

  it('assigns the initial total supply to the creator', async function () {
    const totalSupply = await this.token.totalSupply();
    const creatorBalance = await this.token.balanceOf(creator);

    creatorBalance.should.be.bignumber.equal(totalSupply);

    await expectEvent.inConstruction(this.token, 'Transfer', {
      from: ZERO_ADDRESS,
      to: creator,
      value: totalSupply,
    });
  });
});
