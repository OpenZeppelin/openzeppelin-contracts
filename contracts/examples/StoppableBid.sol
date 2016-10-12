pragma solidity ^0.4.0;

import '../PullPayment.sol';
import '../Stoppable.sol';

contract StoppableBid is Stoppable, PullPayment {
  address public highestBidder;
  uint public highestBid;

  function StoppableBid(address _curator)
    Stoppable(_curator)
    PullPayment() {}

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
