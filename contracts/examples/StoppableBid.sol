import './PullPaymentCapable.sol';
import './Stoppable.sol';

contract StoppableBid is Stoppable, PullPaymentCapable {
  address public highestBidder;
  uint public highestBid;

  function StoppableBid(address _curator)
    Stoppable(_curator)
    PullPaymentCapable() {}

  function bid() external stopInEmergency {
    if (msg.value <= highestBid) throw;
    
    if (highestBidder != 0) {
      asyncSend(highestBidder, highestBid);
    }
    highestBidder = msg.sender;
    highestBid = msg.value;
  }

  function withdraw() onlyInEmergency {
    suicide(curator);
  }

}
