pragma solidity ^0.4.23;
import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC721/ERC721BasicToken.sol";


/**
 * @title DutchAuction
 * @author Doug Crescenzi, Kseniya Lifanova - team@upstate.agency
 * @notice DutchAuction is a contract for managing the dutch auction of a non-fungible token (NFT). 
 * The contract owner, or beneficiary, sets their high asking price and their low, 
 * reserve price for the NFT they are auctioning off. Additionally, the beneficiary sets the 
 * lenght of time for which they'd like their auction to run.
 * 
 * To start the auction the beneficiary calls the startAuction function and passes it the 
 * token's contract as well as the tokenId of the NFT they are auctioning. 
 * The asking price for the NFT decreases every day at a rate that is proportional 
 * to the total amount of time between the high asking price and the low, reserve price. 
 * E.g., (highAskingPrice - lowAskingPrice) / auctionLength = descendingPriceRate
 * 
 * The first bidder to bid on the NFT's currentAskingPrice is awarded the NFT.
 * 
 * This has also been called a clock auction or open-outcry descending-price auction. 
 * This type of auction is good for auctioning goods quickly, 
 * since a sale never requires more than one bid. 
 **/
contract DutchAuction is Ownable {
  using SafeMath for uint256;
  /// The address of the user auctioning off their NFT
  address public beneficiary;
  /// The address of the user that bids on the NFT
  address public bidder;
  /// The value of the bid from the bidder
  uint public bid;
  /// The difference between the bid and currentAskingPrice if bid is higher
  uint public overage;
  /// The number of days the auction will run for. 
  /// See `startAuction` and `getCurrentAskingPrice` for how _auctionLength is used and why it's in days
  uint public auctionLength;  
  /// The time at which the auction should start
  uint public startTime;
  /// The time at which the auction should end
  uint public endTime;
  /// The high asking price sought for the NFT
  uint public highAskingPrice;  
  /// The absolute lowest price that would be accepted in returnfor the NFT
  uint public lowAskingPrice;
  /// The auction's current asking price for the NFT
  uint public currentAskingPrice;
  /// The NFT's contract's address
  address public tokenContract;
  /// The NFT's unique ID
  uint public tokenId;
  /// @dev create user-defined "Stages" type to manage state of the auction
  Stages public stage;
  enum Stages {
     AuctionDeployed,
     AuctionStarted,
     AuctionEnded
  }
  /// @dev Event for auction logging
  /// @param beneficiary who sold the NFT
  /// @param bidder who paid for the NFT
  /// @param bid amount in weis paid for the NFT
  event TokenAuctioned(
    address indexed beneficiary,
    address indexed bidder,
    uint256 bid,
    uint256 indexed tokenId
  );
  /// @dev Modifier use to ensure the auction is at the appropriate stage 
  modifier atStage(Stages _stage) {
    if (stage != _stage)
      revert("The auction is not at the appropriate stage");
    _;
  }
  /// @dev Modifier used to ensure a bid is valid and can be processed
  modifier validBid() {
    require(msg.value > 0);
    require(block.timestamp >= startTime);
    require(block.timestamp <= endTime);
    _;
  }
  /// @dev Contructor used to setup the auction's preliminaries
  /// @param _highAskingPrice for the NFT
  /// @param _lowAskingPrice or reserve price for the NFT
  /// @param _auctionLength the number of days the auction will run for. 
  /// See `startAuction` and `getCurrentAskingPrice` for how _auctionLength is used and why it's in days
  constructor(uint _highAskingPrice, uint _lowAskingPrice, uint _auctionLength) 
    public 
  {
    require(_lowAskingPrice < _highAskingPrice && _lowAskingPrice > 0 && _highAskingPrice > 0);
    highAskingPrice = _highAskingPrice;
    lowAskingPrice = _lowAskingPrice;
    auctionLength = _auctionLength;
    stage = Stages.AuctionDeployed;
  }
  /// @dev Fallback function - if the auction is active, make a bid on behalf of msg.sender
  function () 
    public 
    payable 
  {
    if (stage != Stages.AuctionStarted && msg.sender != beneficiary)
      revert("The auction is not at the appropriate stage");
    processBid();
  }
  /// @dev Starts auction and determines the auction's endTime
  /// @param _tokenContract the address of the 
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
  /// @dev The first one to provide a bid at the currentAskingPrice is awarded the beneficiary's NFT
  /// @dev If a bidder overbids on the NFT they will win the auction and their overage will be returned
  function processBid() 
    public 
    payable 
    atStage(Stages.AuctionStarted)
    validBid()
    returns (uint)
 {    
    bid = msg.value;
    bidder = msg.sender;
    getCurrentAskingPrice(); 
    if (bid > currentAskingPrice) {
      overage = bid.sub(currentAskingPrice);
      bidder.transfer(overage);
      bid = currentAskingPrice;
      stage = Stages.AuctionEnded;  
      payBeneficiary();
      sendToBidder();
    } else if (bid == currentAskingPrice) {
      stage = Stages.AuctionEnded;  
      payBeneficiary();
      sendToBidder();
    } else {
      revert("Bid is lower than currentAskingPrice");
    }
  }
  /// @dev Pay the beneficiary the ETH from the bidder's bid
  function payBeneficiary()
    internal 
    atStage(Stages.AuctionEnded)
    returns (bool)
  {
    beneficiary.transfer(bid);
    return true;
  }
  /// @dev Send the bidder the NFT with `safeTransferFrom`
  /// @dev In order for this contract to perform `safeTransferFrom` and transfer the NFT,
  /// the beneficiary must approve DutchAuction to send the NFT to the bidder.
  /// Here's an example from `DutchAuction.test.js`:
  /// await auction.startAuction(token.address, tokenId, { from: web3.eth.accounts[0] });
  /// await token.approve(auction.address, tokenId, {from: beneficiary});
  /// @return Boolean to acknowledge the transfer of the NFT from the beneficiary to the bidder was successful.
  function sendToBidder() 
    internal
    atStage(Stages.AuctionEnded) 
    returns (bool)
  {
    ERC721BasicToken erc721Token = ERC721BasicToken(tokenContract);
    erc721Token.safeTransferFrom(beneficiary, bidder, tokenId);
   /// Emit event for token auction logging
   /// @param beneficiary who auctioned off their NFT
   /// @param bidder who paid for the beneficiary's NFT
   /// @param bid provided that met the currentAskingPrice and enabled the transfer 
   /// @param tokenId of the NFT
    emit TokenAuctioned(
      beneficiary,
      bidder,
      bid,
      tokenId
    );
    return true;
  }
  /// @dev Determines the current asking price for the ERC721 token that's being auctioned
  /// @return The auction's currentAskingPrice 
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
}