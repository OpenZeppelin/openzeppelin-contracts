// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";

contract ERC7540Mock is ERC7540 {
    constructor(IERC20 asset) ERC20("ERC7540Mock", "E7540M") ERC7540(asset) {}

    function _processPendingRequests(uint256 requestId, address controller) internal view override {
        // ToDo
    }
}
