pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC721/ERC721BasicToken.sol";
/*
 * @title DutchAuction
 * @dev DutchAuction is a contract for managing a dutch auction. A beneficiary sets their
 * high asking price and their low, reserve price for the ERC721 token they are auctioning. 
 * Additionally, the beneficiary sets how long they'd like for the auction to run. 
 * After the auction starts, the asking price descends at a rate that is proportional 
 * to the total amount between the high asking price and the low, reserve price. 
 * E.g., (highAskingPrice - lowAskingPrice) / totalAuctionTime = descendingPriceRate
 * 
 * This has also been called a clock auction or open-outcry descending-price auction. 
 * This type of auction is good for auctioning goods quickly, 
 * since a sale never requires more than one bid. 
 */

contract DutchAuction is Ownable{
  using SafeMath for uint256;

  address public beneficiary;
  address public winner;

  uint public auctionLength;
  uint public startTime;
  uint public endTime;

  uint public highAskingPrice;
  uint public lowAskingPrice;
  uint public currentAskingPrice;

  address public bidder;
  uint public bid;

  /// @dev create user-defined "Stages" type to manage state of the auction
  Stages public stage;

  enum Stages {
     AuctionDeployed,
     AuctionStarted,
     AuctionEnded
  }

  modifier atStage(Stages _stage) {
   if (stage != _stage)
       revert();
   _;
  }

  constructor(address _beneficiary, uint _highAskingPrice, uint _lowAskingPrice, uint _auctionLength) 
    public 
  {
  	require(_lowAskingPrice < _highAskingPrice && _lowAskingPrice > 0 && _highAskingPrice > 0);

  	highAskingPrice = _highAskingPrice;
  	lowAskingPrice = _lowAskingPrice;
  	auctionLength = _auctionLength;
    beneficiary = _beneficiary;

    stage = Stages.AuctionDeployed;
  }

  /// @dev fallback function to call processBid if the auction has started
  function () 
    public 
    payable 
  {
    if(stage != Stages.AuctionStarted)
    revert();
 //   processBid(msg.sender);
  }

  /// @dev Starts auction and identifies the auction's endTime
  function startAuction()
      public
      onlyOwner
      atStage(Stages.AuctionDeployed)
  {
      startTime = now;
      endTime = startTime + auctionLength;
      stage = Stages.AuctionStarted;
  }

}

/* Kseniya
  function findCurrentPrice () public returns (bool) {
  	// (highAskingPrice - lowAskingPrice) / auctionLength = descendingPriceRate

  }

  function processBid (address _bidder) public payable {
  	require(bid > 0 && bid != 0 && bid == currentAskingPrice);

  	bid = msg.value;
  	bidder = _bidder;

  	payBeneficiary(bidder, bid);
  }

  function returnToBeneficiary (address _beneficiary) internal {

  }

  function payBeneficiary (address _beneficiary, uint bid) internal {

  } 
*/