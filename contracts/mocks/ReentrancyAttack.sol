pragma solidity ^0.5.0;

contract ReentrancyAttack {

    function callSender(bytes4 data) public {
        (bool success,) = msg.sender.call(abi.encodeWithSelector(data));
        require(success);
    }

}
