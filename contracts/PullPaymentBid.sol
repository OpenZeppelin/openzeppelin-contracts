import './PullPaymentCapable.sol';

contract PullPaymentBid is PullPaymentCapable {
  address public highestBidder;
  uint public highestBid;
  
  function bid() external {
    if (msg.value <= highestBid) throw;
    
    if (highestBidder != 0) {
      asyncSend(highestBidder, highestBid);
    }
    highestBidder = msg.sender;
    highestBid = msg.value;
  }
}
