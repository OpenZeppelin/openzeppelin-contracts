// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";

contract ERC7540Mock is ERC7540 {
    constructor(address asset) ERC20("ERC4626Mock", "E4626M") ERC7540(IERC20(asset)) {}

    function processPendingDeposit(uint256 requestId, address controller) external {
        Request storage request = _pendingDepositRequests[controller][requestId];
        require(request.amount > 0, "No pending deposit request");

        request.claimable += request.amount;
        request.amount = 0;
    }

    function processPendingRedeem(uint256 requestId, address controller) external {
        Request storage request = _pendingRedeemRequests[controller][requestId];
        require(request.amount > 0, "No pending redeem request");

        request.claimable += request.amount;
        request.amount = 0;
    }

    function _processPendingRequests(uint256 requestId, address controller) internal override {
        Request storage depositRequest = _pendingDepositRequests[controller][requestId];
        if (depositRequest.amount > 0) {
            depositRequest.claimable += depositRequest.amount;
            emit DepositProcessed(controller, requestId, depositRequest.amount);
            depositRequest.amount = 0;
        }

        Request storage redeemRequest = _pendingRedeemRequests[controller][requestId];
        if (redeemRequest.amount > 0) {
            redeemRequest.claimable += redeemRequest.amount;
            emit RedeemProcessed(controller, requestId, redeemRequest.amount);
            redeemRequest.amount = 0;
        }
    }
}
