pragma solidity ^0.5.7;

contract ReentrancyAttack {
    function callSender(bytes4 data) public {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = msg.sender.call(abi.encodeWithSelector(data));
        require(success);
    }
}
