import ether from '../helpers/ether';

const BigNumber = web3.BigNumber;

const DutchAuction = artifacts.require('DutchAuction');

contract('DutchAuction', function (accounts) {
  let auction;
  var chai = require('chai');
  var assert = chai.assert;

  var _highAskingPrice = 1000;
  var _lowAskingPrice = 500;
  var _auctionLength = 10;
  var _beneficiary = accounts[0];

  var _currentAskingPrice = 750;
  var _bid = 750;

  beforeEach(async function () {
    auction = await DutchAuction.new(_beneficiary, _highAskingPrice, _lowAskingPrice, _auctionLength);
  });

  describe('start an auction', function () {
  	it('should include a beneficiary', function () {
      assert.exists({ _beneficiary }, '_beneficiary is neither `null` nor `undefined`');
    });

    it('should include a high asking price', function () {
	    assert.exists({ _highAskingPrice: 1000 }, '_highAskingPrice is neither `null` nor `undefined`');
  	});

  	it('should include a low asking price', function () {
	    assert.exists({ _lowAskingPrice: 500 }, '_lowAskingPrice is neither `null` nor `undefined`');
  	});

  	it('should have a low asking price that is greater than 0', function () {
      assert.isAbove(_lowAskingPrice, 0, '_lowAskingPrice is greater than 0');
  	});

  	it('should have a high asking price that is greater than 0', function () {
      assert.isAbove(_highAskingPrice, 0, '_lowAskingPrice is greater than 0');
  	});

  	it('should have a low asking price that is less than the high asking price', function () {
      assert.isBelow(_lowAskingPrice, _highAskingPrice, '_lowAskingPrice is less than _highAskingPrice');
  	});

  	it('should include an auction length', function () {
	    assert.exists({ _auctionLength: 10 }, '_auctionLength is neither `null` nor `undefined`');
  	});

  	it('the contract address that calls DutchAuction should be the beneficiary', function () {

  	});
  });

  describe('find current asking price', function () {
  	it('should return the current price of the auction', function () {

  	});

  	it('should return a value in ether', function () {

  	});
  });

  describe('decrease the asking price', function () {
  	it('should decrease at a rate proportional to the high and low asking prices', function () {

  	});
  });

  describe('process a bid', function () {
  	it('should not accept bids less than or equal to 0', function () {
      assert.isAbove(_bid, 0, '_bid is greater than 0');
  	});

  	it('should accept a bid equal to the current asking price', function () {
      assert.equal(_bid, _currentAskingPrice, '_bid is equal to __currentAskingPrice');
  	});
  });

  describe('pay the beneficiary and award the auction winner', function () {
  	it('should pay the beneficiary after a bid has been received', function () {

  	});

  	it('should send the item to the auction winner', function () {

  	});
  });

  describe('auction ends with no bids', function () {
  	it('should return the item to the beneficiary if the auction ends with no bids', function () {

  	});
  });
});
