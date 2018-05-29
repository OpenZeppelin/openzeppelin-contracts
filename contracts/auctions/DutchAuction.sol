pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC721/ERC721.sol";

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
  address public bidder;
  uint public bid;

  uint public auctionLength;
  uint public startTime;
  uint public endTime;

  uint public highAskingPrice;
  uint public lowAskingPrice;

  /// REMOVE THE 1 ETHER VALUE AFTER findCurrentPrice IS IMPLEMENTED
  uint public currentAskingPrice = 15 ether;

  // @dev The token being auctioned
  ERC721 public token;

  // @dev ERC721 token's unique ID
  uint public tokenId;

  // @dev Mapping from token ID to owner
  mapping (uint256 => address) internal tokenOwner;

  // @dev Mapping from token ID to approved address
  mapping (uint256 => address) internal tokenApprovals;

  /// @dev create user-defined "Stages" type to manage state of the auction
  Stages public stage;

  enum Stages {
     AuctionDeployed,
     AuctionStarted,
     AuctionEnded
  }

  modifier atStage(Stages _stage) {
   if (stage != _stage)
       revert("The auction is not at the appropriate stage");
   _;
  }

  modifier validBid() {
     require(msg.value > 0);
     require(msg.value == currentAskingPrice);
     _;
   }

  constructor(uint _highAskingPrice, uint _lowAskingPrice, uint _auctionLength) 
    public 
  {
    require(_lowAskingPrice < _highAskingPrice && _lowAskingPrice > 0 && _highAskingPrice > 0);

    highAskingPrice = _highAskingPrice;
    lowAskingPrice = _lowAskingPrice;
    auctionLength = _auctionLength;

    stage = Stages.AuctionDeployed;
  }

  /// @dev fallback function - if the auction is active, make a bid for msg.sender
  function () 
    public 
    payable 
  {
    if(stage != Stages.AuctionStarted)
      revert("The auction is not at the appropriate stage");
      processBid();
  }

  /// @dev Starts auction and identifies the auction's endTime
  /// @param _beneficiary address that will receive payment in return for their ERC721 token
  function startAuction(address _beneficiary, uint _tokenId)
    public
    onlyOwner
    atStage(Stages.AuctionDeployed)
  {
    beneficiary = _beneficiary;
    startTime = now;
    endTime = startTime + auctionLength * 1 days;
    stage = Stages.AuctionStarted;
    tokenId = _tokenId;
    tokenOwner[tokenId] = beneficiary;
  }

/* Kseniya
  function findCurrentPrice () public returns (bool) {
    // (highAskingPrice - lowAskingPrice) / auctionLength = descendingPriceRate
  }
*/

  /// @dev The first one to bid wins the ERC721 token 
  function processBid() 
    public 
    payable 
    atStage(Stages.AuctionStarted)
    validBid()
 {    
    bid = msg.value;
    bidder = msg.sender;

    stage = Stages.AuctionEnded;

    payBeneficiary();
    sendToBidder();
  }

  /// @dev Pay the _beneficiary the ETH from the bidder's bid
  function payBeneficiary()
    internal 
    atStage(Stages.AuctionEnded)
    returns (bool)
  {
    beneficiary.transfer(bid);

    return true;
  }

  /// @dev Award bidder with the ERC721 token 
  function sendToBidder() 
    internal 
    atStage(Stages.AuctionEnded) 
  {
  // Ensure they have permission to send ERC721 token
  // approve(bidder, tokenId);

    tokenApprovals[tokenId] = bidder;

    tokenOwner[tokenId] = bidder;

    token.safeTransferFrom(beneficiary, bidder, tokenId);
  }

  /// @dev If no bid is received during auctionLength, return the ERC721 token to the _beneficiary
  function returnToBeneficiary() 
    internal 
    view 
    atStage(Stages.AuctionEnded) 
  {

  }
}