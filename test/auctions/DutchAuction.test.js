import ether from '../helpers/ether';
import expectThrow from '../helpers/expectThrow';
import assertRevert from '../helpers/assertRevert';

const DutchAuction = artifacts.require('DutchAuction');
const ERC721BasicToken = artifacts.require('ERC721BasicToken.sol');
const ERC721BasicTokenMock = artifacts.require('ERC721BasicTokenMock.sol');

const chai = require('chai');
const assert = chai.assert;

contract('DutchAuction', function (accounts) {
  
  let auction;
  const highAskingPrice = 2;
  const lowAskingPrice = 1;
  const auctionLength = 5;
  let currentAskingPrice;

  let beneficiary = accounts[0];
  let bidder = accounts[2];
  let bid;

  let token;
  const tokenId = 12345;

  beforeEach(async function () {
    token = await ERC721BasicTokenMock.new({ from: beneficiary });
    await token.mint(beneficiary, tokenId, { from: beneficiary });
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
  	it('should revert if bid is less than currentAskingPrice', async function () {
      bid = ether(1);
      await auction.startAuction(token.address, tokenId, { from: beneficiary});
      await token.approve(auction.address, tokenId, {from: beneficiary});
      await assertRevert(auction.processBid( {from: bidder, value: bid }));
    });

    it('should transfer overage to bidder if bid is greater than currentAskingPrice', async function () {
      bid = ether(3);
      // original balance of bidder
      const bidderOriginalBalance = web3.eth.getBalance(bidder);

      await auction.startAuction(token.address, tokenId, { from: beneficiary});
      await token.approve(auction.address, tokenId, {from: beneficiary});

      // obtain gas used from the receipt
      const txReceipt = await auction.processBid({from: bidder, value: bid});
      const gasUsed = txReceipt.receipt.gasUsed;

      // obtain gasPrice from the transaction
      const transaction = await web3.eth.getTransaction(txReceipt.tx);
      const gasPrice = transaction.gasPrice;
      const totalGasCost = gasPrice.mul(gasUsed).toString();
      
      const currentAskingPrice = await auction.currentAskingPrice();
      const bidderFinalBalance = web3.eth.getBalance(bidder);
      const correctBalance = (bidderOriginalBalance.sub(currentAskingPrice)).sub(totalGasCost);
      assert.equal(bidderFinalBalance.toNumber(), correctBalance.toNumber());
    });   

    it('should find the currentAskingPrice after an auction has started', async function () {
      bid = ether(2);
      await auction.startAuction(token.address, tokenId, { from: beneficiary});
      await token.approve(auction.address, tokenId, {from: beneficiary});
      await auction.processBid( {from: bidder, value: bid });
      const currentAskingPrice = await auction.currentAskingPrice();
      assert.exists(currentAskingPrice.toNumber(), 'currentAskingPrice is neither `null` nor `undefined`');
      assert.isAbove(currentAskingPrice.toNumber(), 0, 'currentAskingPrice is greater than 0');
    });  
  });

  describe('pay the beneficiary', function () {
  	it('the bidder should pay the beneficiary after a bid at currentAskingPrice has been received', async function () {
      bid = ether(2);
      const beneficiaryOriginalBalance = web3.eth.getBalance(beneficiary);
      const txHash1 = await auction.startAuction(token.address, tokenId, { from: beneficiary });
      const txHash2 = await token.approve(auction.address, tokenId, {from: beneficiary});

      await auction.processBid({from: bidder, value: bid});

      const tx1 = await web3.eth.getTransaction(txHash1.tx);
      const gasPrice1 = tx1.gasPrice;

      const tx2 = await web3.eth.getTransaction(txHash2.tx);
      const gasPrice2 = tx2.gasPrice;

      const txHash1_TransactionReceipt = web3.eth.getTransactionReceipt(txHash1.tx);
      const txHash2_TransactionReceipt = web3.eth.getTransactionReceipt(txHash2.tx);

      const gasForTransaction1 = txHash1_TransactionReceipt.gasUsed;
      const gasForTransaction2 = txHash2_TransactionReceipt.gasUsed;

      const gasSpent1 = gasForTransaction1 * gasPrice1;
      const gasSpent2 = gasForTransaction2 * gasPrice2;

      const beneficiaryFinalBalance = web3.eth.getBalance(beneficiary);
      const cumulativeGasCost = gasSpent1 + gasSpent2;
      const correctBalance = (beneficiaryOriginalBalance.add(bid)).sub(cumulativeGasCost); 

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
      await token.approve(auction.address, tokenId, {from: beneficiary});
      await auction.processBid({from: bidder, value: bid});
      bidder = await token.ownerOf(tokenId);
      assert.equal(bidder, accounts[2])
      assert.notEqual(bidder, beneficiary, 'bidder and beneficiary are not the same');
    });
  });
});