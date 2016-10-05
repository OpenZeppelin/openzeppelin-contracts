import '../PullPaymentCapable.sol';

// Example class using PullPaymentCapable
contract PullPaymentCapableExample is PullPaymentCapable {
  // test helper function to call asyncSend
  function callSend(address dest, uint amount) external {
    asyncSend(dest, amount);
  }
}
