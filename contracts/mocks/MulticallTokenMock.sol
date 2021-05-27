// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Multicall.sol";
import "./ERC20Mock.sol";

contract MulticallTokenMock is ERC20Mock, Multicall {
    constructor(uint256 initialBalance) ERC20Mock("MulticallToken", "BCT", msg.sender, initialBalance) {}
}
