contract PullPaymentCapable {
  mapping(address => uint) refunds;

  function asyncSend(address dest, uint amount) internal {
    refunds[dest] += amount;
  }

  function withdrawRefund() external {
    uint refund = refunds[msg.sender];
    refunds[msg.sender] = 0;
    if (!msg.sender.send(refund)) {
      refunds[msg.sender] = refund;
    }
  }
}
