// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../access/Ownable.sol";
import "../finance/Withdrawable.sol";

contract WithdrawableMock is Ownable, Withdrawable {

    event Received(address, uint);
    
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
