pragma solidity ^0.4.0;

import "./BlockNumberIntervalAction.sol";
import "./PullPayment.sol";

contract BlockNumberIntervalPullPayment is BlockNumberIntervalAction, PullPayment {
  address public payee;
  uint public targetAmount;
  function BlockNumberIntervalPullPayment(uint iSize, address p, uint amount) TimeIntervalAction(iSize) {
    payee = p;
    targetAmount = amount;
  }
  function periodAction(uint times) private {
    asyncSend(payee, targetAmount * times);
  }
}
