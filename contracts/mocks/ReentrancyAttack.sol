pragma solidity ^0.4.24;


contract ReentrancyAttack {

  function callSender(bytes4 _data) public {
    // solium-disable-next-line security/no-low-level-calls
    require(msg.sender.call(abi.encodeWithSelector(_data)));
  }

}
