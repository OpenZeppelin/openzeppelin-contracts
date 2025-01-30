// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";

contract ERC7540Mock is ERC7540 {
    constructor(IERC20 asset) ERC20("ERC4626Mock", "E4626M") ERC7540(asset) {}

    function _processPendingRequests(uint256 requestId, address controller) internal view override {
        // ToDo
    }
}
