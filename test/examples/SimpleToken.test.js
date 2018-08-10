const { decodeLogs } = require('../helpers/decodeLogs');
const SimpleToken = artifacts.require('SimpleToken');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SimpleToken', function ([_, creator]) {
  let token;

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    token = await SimpleToken.new({ from: creator });
  });

  it('has a name', async function () {
    const name = await token.name();
    name.should.eq('SimpleToken');
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    symbol.should.eq('SIM');
  });

  it('has 18 decimals', async function () {
    const decimals = await token.decimals();
    decimals.should.be.bignumber.equal(18);
  });

  it('assigns the initial total supply to the creator', async function () {
    const totalSupply = await token.totalSupply();
    const creatorBalance = await token.balanceOf(creator);

    creatorBalance.should.be.bignumber.equal(totalSupply);

    const receipt = await web3.eth.getTransactionReceipt(token.transactionHash);
    const logs = decodeLogs(receipt.logs, SimpleToken, token.address);
    logs.length.should.eq(1);
    logs[0].event.should.equal('Transfer');
    logs[0].args.from.valueOf().should.equal(ZERO_ADDRESS);
    logs[0].args.to.valueOf().should.equal(creator);
    logs[0].args.value.should.be.bignumber.equal(totalSupply);
  });
});
