pragma solidity ^0.4.0;

import "./TimeIntervalAction.sol";
import "./PullPayment.sol";

contract TimeIntervalPullPayment is TimeIntervalAction, PullPayment {
  address public payee;
  uint public targetAmount;

  function TimeIntervalPullPayment(uint iSize, address p, uint amount) TimeIntervalAction(iSize) {
    payee = p;
    targetAmount = amount;
  }
  function periodAction(uint times) private {
    asyncSend(payee, targetAmount * times);
  }
}
