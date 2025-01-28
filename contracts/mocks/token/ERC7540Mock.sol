// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";

contract ERC7540Mock is ERC7540 {
    constructor(IERC20 asset) ERC20("ERC4626Mock", "E4626M") ERC7540(asset) {}

    function processPendingDeposit(uint256 requestId, address controller) external view {
        Request memory request = getPendingDepositRequest(controller, requestId);
        require(request.amount > 0, "No pending deposit request");

        request.claimable += request.amount;
        request.amount = 0;
    }

    function processPendingRedeem(uint256 requestId, address controller) external view {
        Request memory request = getPendingRedeemRequest(controller, requestId);
        require(request.amount > 0, "No pending redeem request");

        request.claimable += request.amount;
        request.amount = 0;
    }

    function _processPendingRequests(uint256 requestId, address controller) internal override {
        Request memory depositRequest = getPendingDepositRequest(controller, requestId);
        if (depositRequest.amount > 0) {
            depositRequest.claimable += depositRequest.amount;
            depositRequest.amount = 0;
        }

        Request memory redeemRequest = getPendingRedeemRequest(controller, requestId);
        if (redeemRequest.amount > 0) {
            redeemRequest.claimable += redeemRequest.amount;
            redeemRequest.amount = 0;
        }
    }
}
