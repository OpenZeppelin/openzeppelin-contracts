pragma solidity ^0.4.11;

contract ReentrancyAttack {

  function callSender(bytes4 data) {
    require(msg.sender.call(data));
  }

}
