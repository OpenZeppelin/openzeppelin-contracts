pragma solidity ^0.4.0;
contract GoodPullPayments {
  address highestBidder;
  uint highestBid;
  mapping(address => uint) refunds;

  function bid() external {
    if (msg.value < highestBid) throw;

    if (highestBidder != 0) {
      refunds[highestBidder] += highestBid;
    }

    highestBidder = msg.sender;
    highestBid = msg.value;
  }

  function withdrawBid() external {
    uint refund = refunds[msg.sender];
    refunds[msg.sender] = 0;
    if (!msg.sender.send(refund)) {
      refunds[msg.sender] = refund;
    }
  }
}
