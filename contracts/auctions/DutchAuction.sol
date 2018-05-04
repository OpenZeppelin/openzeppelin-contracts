pragma solidity ^0.4.21;

import "../math/SafeMath.sol";

/**
 * @title DutchAuction
 * @dev DutchAuction is a contract for managing a dutch auction. A beneficiary sets their
 * high asking price and their low, reserve price. Additionally, the beneficiary sets how long 
 * they'd like for the auction to run. After the auction starts, the asking price 
 * descends at a rate that is proportional to the total amount between the high asking price
 * and the low, reserve price. 
 * E.g., (highAskingPrice - lowAskingPrice) / totalAuctionTime = descendingPriceRate
 * 
 * This has also been called a clock auction or open-outcry descending-price auction. 
 * This type of auction is good for auctioning goods quickly, 
 * since a sale never requires more than one bid. 
 */

contract DutchAuction {
  using SafeMath for uint256;

  address public beneficiary;
  address public winner;

  uint public auctionLength;
  uint public highAskingPrice;
  uint public lowAskingPrice;
  uint public currentAskingPrice;

  address public bidder;
  uint public bid;

  // Necessary modifiers
  // TBD

 
  function DutchAuction (uint _highAskingPrice, uint _lowAskingPrice, uint _auctionLength) public {
  	highAskingPrice = _highAskingPrice;
  	lowAskingPrice = _lowAskingPrice;
  	auctionLength = _auctionLength;

    require(lowAskingPrice < highAskingPrice);
    require(lowAskingPrice > 0);
    require(highAskingPrice > 0);

  }
/*
  function findCurrentPrice () public returns (bool) {
  	// (highAskingPrice - lowAskingPrice) / auctionLength = descendingPriceRate

  }

  function processBid (uint _bid, address _bidder) public payable {

  }

  function returnToBeneficiary (address _beneficiary) internal {

  }

  function payBeneficiary (address _beneficiary) internal {

  }

  function payWinner (address _winner) internal {

  }
*/
}