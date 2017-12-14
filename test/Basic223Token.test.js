import expectThrow from './helpers/expectThrow';

const assertRevert = require('./helpers/assertRevert');

var Basic223TokenMock = artifacts.require('./helpers/Basic223TokenMock.sol');

contract('Basic223Token', function (accounts) {
  it('should return the correct totalSupply after construction', async function () {
    let token = await Basic223TokenMock.new(accounts[0], 100);
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 100);
  });

  it('should return correct balances after transfer', async function () {
    let token = await Basic223TokenMock.new(accounts[0], 100);
    await token.transfer(accounts[1], 100);

    let firstAccountBalance = await token.balanceOf(accounts[0]);
    assert.equal(firstAccountBalance, 0);

    let secondAccountBalance = await token.balanceOf(accounts[1]);
    assert.equal(secondAccountBalance, 100);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
    let token = await Basic223TokenMock.new(accounts[0], 100);
    try {
      await token.transfer(accounts[1], 101);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transfer to 0x0', async function () {
    let token = await Basic223TokenMock.new(accounts[0], 100);
    try {
      await token.transfer(0x0, 100);
      assert.fail('should have thrown before');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transfer less than 0', async function () {
    let token = await Basic223TokenMock.new(accounts[0], 100);
    await expectThrow(token.transfer(accounts[1], -2));
  });

  it('should throw an error when trying to transfer without any tokens', async function () {
    let token = await Basic223TokenMock.new(accounts[0], 0);
    await expectThrow(token.transfer(accounts[1], 100));
  });
});
