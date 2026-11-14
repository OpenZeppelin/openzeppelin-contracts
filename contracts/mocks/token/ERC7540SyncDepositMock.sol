// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC7540SyncDeposit} from "../../token/ERC20/extensions/ERC7540SyncDeposit.sol";
import {ERC7540AdminRedeem} from "../../token/ERC20/extensions/ERC7540AdminRedeem.sol";

abstract contract ERC7540SyncDepositMock is ERC7540SyncDeposit, ERC7540AdminRedeem {
    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540AdminRedeem) {
        super._requestRedeem(shares, controller, owner, requestId);
    }
}
