// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Context} from "../utils/Context.sol";

contract ReentrancyAttack is Context {
    function callSender(bytes calldata data) public {
        (bool success, ) = _msgSender().call(data);
        require(success, "ReentrancyAttack: failed call");
    }

    function staticcallSender(bytes calldata data) public view {
        (bool success, ) = _msgSender().staticcall(data);
        require(success, "ReentrancyAttack: failed call");
    }
}
