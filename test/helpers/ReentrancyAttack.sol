pragma solidity ^0.4.11;

contract ReentrancyAttack {

  function callSender(bytes4 data) {
    assert(msg.sender.call(data));
  }

}
