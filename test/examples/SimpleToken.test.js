const { decodeLogs } = require('../helpers/decodeLogs');
const SimpleToken = artifacts.require('SimpleToken');

contract('SimpleToken', function ([_, creator]) {
  let token;

  beforeEach(async function () {
    token = await SimpleToken.new({ from: creator });
  });

  it('has a name', async function () {
    const name = await token.name();
    assert.eq(name, 'SimpleToken');
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    assert.eq(symbol, 'SIM');
  });

  it('has 18 decimals', async function () {
    const decimals = await token.decimals();
    assert(decimals.eq(18));
  });

  it('assigns the initial total supply to the creator', async function () {
    const totalSupply = await token.totalSupply();
    const creatorBalance = await token.balanceOf(creator);

    assert(creatorBalance.eq(totalSupply));

    const receipt = await web3.eth.getTransactionReceipt(token.transactionHash);
    const logs = decodeLogs(receipt.logs, SimpleToken, token.address);
    assert.eq(logs.length, 1);
    assert.eq(logs[0].event, 'Transfer');
    assert.eq(logs[0].args.from.valueOf(), 0x0);
    assert.eq(logs[0].args.to.valueOf(), creator);
    assert(logs[0].args.value.eq(totalSupply));
  });
});
