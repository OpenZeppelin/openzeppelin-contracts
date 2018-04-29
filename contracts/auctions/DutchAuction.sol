pragma solidity ^0.4.21;

import "../token/ERC20/ERC20.sol";
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

  uint public auctionLength;
  uint public highAskingPrice;
  uint public lowAskingPrice;

  address public bidder;
  uint public bid;

  // Necessary modifiers
  // TBD

  function DutchAuction (
  	uint _auctionLength, 
  	uint _highAskingPrice, 
  	uint _lowAskingPrice) public {

  }

  function findCurrentPrice () public {
  	// (highAskingPrice - lowAskingPrice) / totalAuctionTime = descendingPriceRate
  }

  function placeBid (uint _bid, address _bidder) public payable {

  }

  function payBeneficiary (address _beneficiary) internal {

  }

}