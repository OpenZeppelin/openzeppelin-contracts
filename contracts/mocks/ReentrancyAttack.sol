// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

contract ReentrancyAttack {
    function callSender(bytes calldata data) public {
        (bool success, ) = msg.sender.call(data);
        require(success, "ReentrancyAttack: failed call");
    }

    function staticcallSender(bytes calldata data) public view {
        (bool success, ) = msg.sender.staticcall(data);
        require(success, "ReentrancyAttack: failed call");
    }
}
