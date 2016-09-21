import '../PullPaymentCapable.sol';

contract PullPaymentBid is PullPaymentCapable {
  address public highestBidder;
  uint public highestBid;

  function bid() external returns (bool) {
    if (msg.value <= highestBid) return false;

    if (highestBidder != 0) {
      asyncSend(highestBidder, highestBid);
    }
    highestBidder = msg.sender;
    highestBid = msg.value;
    return true;
  }
}
