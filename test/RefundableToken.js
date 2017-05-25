'use strict';

var RefundableTokenMock = artifacts.require('./helpers/RefundableTokenMock.sol');

contract('RefundableToken', function(accounts) {
  let AMOUNT;
  let refundee;
  let token;

  beforeEach(async function() {
    AMOUNT = 17*1e18;
    refundee = accounts[1];
    token = await RefundableTokenMock.new(refundee, AMOUNT, {value: AMOUNT});
  });

  it ('should return refundRate of 100 after contruction', async function () {
    let refundRate = await token.refundRate();

    assert.equal(refundRate, 100);
  });

  it ('should change refundRate to given amount', async function(){
    await token.setRefundRate(50);
    let refundRate = await token.refundRate();

    assert.equal(refundRate, 50);
  });

  it ('should be able to give refund given the token amount', async function() {
    let tokenAmount = AMOUNT/2; 

    let balance1 = await token.balanceOf(refundee);
    assert.equal(balance1, AMOUNT);

    await token.refund(tokenAmount, {from: refundee});

    let balance2 = await token.balanceOf(refundee);

    assert.equal(balance2, tokenAmount);
  });

  it ('should be able to give refund based on the refundRate', async function() {
    let refundee1 = accounts[1];
    let refundee2 = accounts[2];
    let refundee3 = accounts[3];

    let token1 = await RefundableTokenMock.new(refundee1, AMOUNT, {value: AMOUNT, from: accounts[7]});
    let token2 = await RefundableTokenMock.new(refundee2, AMOUNT, {value: AMOUNT, from: accounts[8]});
    let token3 = await RefundableTokenMock.new(refundee3, AMOUNT, {value: AMOUNT, from: accounts[9]});

    await token1.setRefundRate(50, {from: accounts[7]});
    await token3.setRefundRate(150, {from: accounts[9]});

    await token1.refund(AMOUNT, {from: refundee1});
    await token2.refund(AMOUNT, {from: refundee2});
    await token3.refund(AMOUNT, {from: refundee3});

    let endBalance1 = web3.eth.getBalance(refundee1);
    let endBalance2 = web3.eth.getBalance(refundee2);
    let endBalance3 = web3.eth.getBalance(refundee2);

    assert(endBalance1 < endBalance2 < endBalance3);
  });
})