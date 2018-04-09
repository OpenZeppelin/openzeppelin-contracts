pragma solidity ^0.4.21;


contract ReentrancyAttack {

  function callSender(bytes4 data) public {
    require(msg.sender.call(data));
  }

}
