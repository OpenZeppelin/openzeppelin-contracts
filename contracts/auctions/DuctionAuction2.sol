pragma solidity ^0.4.11;

import '../token/MintableToken.sol';
import '../math/SafeMath.sol';
import '../ownership/Ownable.sol';

/**
 * @title DutchAuction
 * @notice Dutch Auction Crowdsale
 */
 contract DutchAuction is Ownable{

     using SafeMath for uint256;
     /*
      *  Events
      */
     event BidSubmission(address indexed sender, uint256 amount);

     /*
      *  Storage
      */
     MintableToken public token;
     address public wallet;
     uint public ceiling;

     uint public startTime;
     uint public endTime;
     uint public duration;
     uint public inicialPrice;
     uint public decreaseRate;

     uint public totalReceived;
     uint public finalPrice;

     mapping (address => uint) public bids;
     Stages public stage;

     enum Stages {
         AuctionDeployed,
         AuctionSetup,
         AuctionStarted,
         AuctionEnded
     }

     /*
      *  Modifiers
      */
     modifier atStage(Stages _stage) {
         if (stage != _stage)
             revert();
         _;
     }

     modifier validPurchase() {
       require(msg.value > 0);
       require(block.timestamp >= startTime);
       if(block.timestamp > endTime){
         finalizeAuction();
         return;
       }
       _;
     }

     /*
      *  Public functions
      */
     /// @dev Contract constructor function sets owner
     /// @param _wallet address Destination wallet
     /// @param _ceiling uint Auction ceiling
     function DutchAuction(address _wallet, uint _ceiling)
         public
     {
         if (_wallet == 0 || _ceiling == 0)
             revert();

         owner = msg.sender;
         token = createTokenContract();
         wallet = _wallet;
         ceiling = _ceiling;
         stage = Stages.AuctionDeployed;
     }


     function setup(uint _duration, uint _inicialPrice, uint _decreaseRate)
         public
         onlyOwner
         atStage(Stages.AuctionDeployed)
    {
        if (_duration == 0 || _inicialPrice == 0 || _decreaseRate == 0)
            revert();

        duration = _duration;
        inicialPrice = _inicialPrice;
        decreaseRate = _decreaseRate;
        stage = Stages.AuctionSetup;
    }

    /// @dev Starts auction and sets the duration
    function startAuction()
        public
        onlyOwner
        atStage(Stages.AuctionSetup)
    {
        startTime = now;
        endTime = startTime + duration * 1 days;
        stage = Stages.AuctionStarted;
    }

     /*
      *  Fallback function
      */
     /// @dev If the auction is active, make a bid for msg.sender
     function()
         public
         payable
     {
         if(stage != Stages.AuctionStarted)
           revert();
         bid(msg.sender);
     }

     event Degu(uint bid);
     /// @dev Allows to send a bid to the auction
     /// @param receiver address Bid will be assigned to this address
     function bid(address receiver)
         public
         payable
         atStage(Stages.AuctionStarted)
         validPurchase()
         returns (uint amount)
     {
         if(hasReachedEndBlock()) {
           finalizeAuction();
           return;
         }

         amount = msg.value;
         uint maxBid = ceiling - totalReceived;
         if (amount > maxBid) {
             amount = maxBid;
             receiver.transfer(msg.value - amount);
         }
         wallet.transfer(amount);
         bids[receiver] += amount;
         totalReceived = totalReceived + amount;
         if (maxBid == amount)
             finalizeAuction();
         BidSubmission(receiver, amount);
     }

     /// @dev Claims tokens for bidder after auction.
     function claimTokens()
         public
         atStage(Stages.AuctionEnded)
     {
         //Add in this equation the number of decimal places in your token.
         // If the token has 10 ** 18, the token count becomes:
         // tokenCount = bids[msg.sender] * 10 ** 18 / finalPrice + 1;
         uint tokenCount = bids[msg.sender] * 10 ** 18 / finalPrice + 1;
         bids[msg.sender] = 0;
         token.transfer(msg.sender, tokenCount);
     }

     /// @notice The price function calculates the token price in the current block.
     /// @return Returns token price
     function calcTokenPrice()
         constant
         public
         returns (uint)
     {
         if (block.timestamp <= endTime) {
            return inicialPrice - decreaseRate * (block.timestamp - startTime);
         } else {
            return inicialPrice - decreaseRate * (endTime - startTime);
         }

     }

     /* 
      *  Private functions
      */
     function finalizeAuction()
         private
     {
         stage = Stages.AuctionEnded;
         finalPrice = calcTokenPrice();
         // Crowdsale must be an authorized token minter
         token.mint(this, totalReceived * 10 ** 18 / finalPrice + 1);
     }

     // creates the token to be sold.
     // override this method to have crowdsale of a specific mintable token.
     function createTokenContract() internal returns (MintableToken) {
       return new MintableToken();
     }

     function hasReachedEndBlock() internal returns(bool) {
       return block.timestamp > endTime;
     }
 }