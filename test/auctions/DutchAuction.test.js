import ether from '../helpers/ether';

const DutchAuction = artifacts.require('DutchAuction');
const ERC721BasicToken = artifacts.require('ERC721BasicToken.sol');
const ERC721BasicTokenMock = artifacts.require('ERC721BasicTokenMock.sol');

var chai = require('chai');
var assert = chai.assert;

contract('DutchAuction', function (accounts) {
  
  var auction;
  var highAskingPrice = 2;
  var lowAskingPrice = 1;
  var auctionLength = 5;
  var currentAskingPrice;

  var beneficiary = accounts[0];
  var bidder = accounts[2];
  var bid = ether(2);

  var token;
  var tokenId = 12345;

  beforeEach(async function () {
    token = await ERC721BasicTokenMock.new({ from: web3.eth.accounts[0] });
    await token.mint(beneficiary, tokenId, { from: web3.eth.accounts[0] });
    auction = await DutchAuction.new(highAskingPrice, lowAskingPrice, auctionLength);
  });

  describe('start an auction', function () {
    it('should include a high asking price', function () {
	    assert.exists(highAskingPrice, 'highAskingPrice is neither `null` nor `undefined`');
  	});

  	it('should include a low asking price', function () {
	    assert.exists(lowAskingPrice, 'lowAskingPrice is neither `null` nor `undefined`');
  	});

  	it('should have a low asking price that is greater than 0', function () {
      assert.isAbove(lowAskingPrice, 0, 'lowAskingPrice is greater than 0');
  	});

  	it('should have a high asking price that is greater than 0', function () {
      assert.isAbove(highAskingPrice, 0, 'highAskingPrice is greater than 0');
  	});

  	it('should have a low asking price that is less than the high asking price', function () {
      assert.isBelow(lowAskingPrice, highAskingPrice, 'lowAskingPrice is less than _highAskingPrice');
  	});

  	it('should include an auction length', function () {
	    assert.exists(auctionLength, 'auctionLength is neither `null` nor `undefined`');
  	});

    it('should include an auction length great than 0', function () {
      assert.isAbove(auctionLength, 0, 'auctionLength is greater than 0');
    });
  });

  describe('process a bid', function () {
  	it('should not accept a bid that does not equal the currentAskingPrice', async function () {
      var badBid = ether(1);
      await auction.startAuction(token.address, tokenId, { from: web3.eth.accounts[0] });
      await token.approve(auction.address, tokenId, {from: web3.eth.accounts[0]});
      await auction.processBid( {from: bidder, value: badBid });
      currentAskingPrice = await auction.findCurrentAskingPrice({from: auction.address});
      assert.notEqual(badBid.toNumber(), currentAskingPrice.toNumber(), 'bid is not equal to currentAskingPrice');
  	});  

    it('should find the currentAskingPrice after an auction has started', async function () {
      await auction.startAuction(token.address, tokenId, { from: web3.eth.accounts[0] });
      await token.approve(auction.address, tokenId, {from: web3.eth.accounts[0]});
      await auction.processBid( {from: bidder, value: ether(1) });
      currentAskingPrice = await auction.findCurrentAskingPrice({from: web3.eth.accounts[8]});
      assert.exists(currentAskingPrice.toNumber(), 'currentAskingPrice is neither `null` nor `undefined`');
      assert.isAbove(currentAskingPrice.toNumber(), 0, 'currentAskingPrice is greater than 0');
    });  
  });

  describe('pay the beneficiary', function () {
  	it('the bidder should pay the beneficiary after a bid has been received', async function () {
      var beneficiaryOriginalBalance = web3.eth.getBalance(web3.eth.accounts[0]);
      var txHash1 = await auction.startAuction(token.address, tokenId, { from: web3.eth.accounts[0] });
      var txHash2 = await token.approve(auction.address, tokenId, {from: web3.eth.accounts[0]});

      await auction.processBid({from: web3.eth.accounts[2], value: bid});

      const tx1 = await web3.eth.getTransaction(txHash1.tx);
      const gasPrice1 = tx1.gasPrice;

      const tx2 = await web3.eth.getTransaction(txHash2.tx);
      const gasPrice2 = tx2.gasPrice;

      var txHash1_TransactionReceipt = web3.eth.getTransactionReceipt(txHash1.tx);
      var txHash2_TransactionReceipt = web3.eth.getTransactionReceipt(txHash2.tx);

      var gasForTransaction1 = txHash1_TransactionReceipt.gasUsed;
      var gasForTransaction2 = txHash2_TransactionReceipt.gasUsed;

      var gasSpent1 = gasForTransaction1 * gasPrice1;
      var gasSpent2 = gasForTransaction2 * gasPrice2;

      var beneficiaryFinalBalance = web3.eth.getBalance(web3.eth.accounts[0]);
      var cumulativeGasCost = gasSpent1 + gasSpent2;
      var correctBalance = (beneficiaryOriginalBalance.add(bid)).sub(cumulativeGasCost); 

      assert.equal(beneficiaryFinalBalance.toNumber(), correctBalance.toNumber(), 'beneficiary final balance is greater than or equal to their original balance plus the bid amount minus was was spent on gas');
    }); 
  });

  describe('award the auction winner the NFT', function () {
    it('the NFT being auctioned exists', async function () {
      assert.exists(tokenId, 'the NFT being auctioned is neither `null` nor `undefined`');
    });

    it('the owner of the NFT being auctioned exists', async function () {
      beneficiary = await token.ownerOf(tokenId);
      assert.exists(beneficiary, 'the beneficiary auctioning the token exists');
    });

    it('the beneficiary is the owner of the NFT', async function () {
      beneficiary = await token.ownerOf(tokenId);
      assert.strictEqual(beneficiary, accounts[0], 'the beneficiary owns the token being auctioned');
    });

    it('should send the NFT to the auction winner', async function () {
      beneficiary = await token.ownerOf(tokenId);
      assert.equal(beneficiary, accounts[0])
      await auction.startAuction(token.address, tokenId, { from: beneficiary });
      await token.approve(auction.address, tokenId, {from: web3.eth.accounts[0]});
      await auction.processBid({from: bidder, value: bid});
      bidder = await token.ownerOf(tokenId);
      assert.equal(bidder, accounts[2])
      assert.notEqual(bidder, beneficiary, 'bidder and beneficiary are not the same');
    });
  });
});