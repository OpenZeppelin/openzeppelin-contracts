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
  address public bidder;
  uint public bid;

  uint public auctionLength;
  uint public startTime;
  uint public endTime;

  uint public highAskingPrice;  
  uint public lowAskingPrice;

  uint public currentAskingPrice;

  address public tokenContract;

  // @dev ERC721BasicToken's unique ID
  uint public tokenId;

  /// @dev create user-defined "Stages" type to manage state of the auction
  Stages public stage;

  enum Stages {
     AuctionDeployed,
     AuctionStarted,
     AuctionEnded
  }

  /**
   * Event for auction logging
   * @param beneficiary who sold the NFT
   * @param bidder who paid for the NFT
   * @param bid amount in weis paid for NFT
   */
  event TokenAuctioned(
    address indexed beneficiary,
    address indexed bidder,
    uint256 bid,
    uint256 tokenId
  );

  modifier atStage(Stages _stage) {
    if (stage != _stage)
      revert("The auction is not at the appropriate stage");
    _;
  }

  modifier validBid() {
    require(msg.value > 0);
    require(block.timestamp >= startTime);
    require(block.timestamp <= endTime);
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

  /// @dev Starts auction and determines the auction's endTime
  /// @param _tokenId ID of the NFT that's being auctioned
  function startAuction(address _tokenContract, uint _tokenId)
    public
    onlyOwner
    atStage(Stages.AuctionDeployed)
  {
    beneficiary = msg.sender;
    startTime = now;
    endTime = startTime.add(auctionLength.mul(1 days));
    stage = Stages.AuctionStarted;
    tokenContract = _tokenContract;
    tokenId = _tokenId;
  }

  /// @dev The first one to bid wins the ERC721 token 
  function processBid() 
    public 
    payable 
    atStage(Stages.AuctionStarted)
    validBid()
 {    
    bid = msg.value;
    bidder = msg.sender;

    getCurrentAskingPrice();   

    if(bid == currentAskingPrice)
    {
      stage = Stages.AuctionEnded;  
      payBeneficiary();
      sendToBidder();
    }   
    else 
    {
      revert("Bid does not match currentAskingPrice");
    } 
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
    returns (bool)
  {
    ERC721BasicToken erc721Token = ERC721BasicToken(tokenContract);
    erc721Token.safeTransferFrom(beneficiary, bidder, tokenId);

    emit TokenAuctioned(
      beneficiary,
      bidder,
      bid,
      tokenId
    );

    return true;
  }

  /// @dev Determines the current asking price for the ERC721 token that's being auctioned
  function getCurrentAskingPrice() 
    internal
    atStage(Stages.AuctionStarted)
    returns (uint)
  {
    uint rateOfDecrease = (highAskingPrice.sub(lowAskingPrice)).div(auctionLength);
    /// @dev The total length of the auction in seconds divided by 86400 (the number of seconds in a day)
    uint numberOfDaysPassed = (now.sub(startTime)).div(1 days);
    /// @dev After every day that has passed subtract the rateOfDecrease from highAskingPrice
    currentAskingPrice = (highAskingPrice.sub(numberOfDaysPassed.mul(rateOfDecrease))).mul(10 ** 18);

    return currentAskingPrice;
  }

  function findCurrentAskingPrice() 
    public
    view
    atStage(Stages.AuctionStarted)
    returns (uint)
  {
    return currentAskingPrice;
  }
}