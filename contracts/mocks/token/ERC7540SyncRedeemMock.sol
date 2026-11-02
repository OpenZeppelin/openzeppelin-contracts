// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC7540SyncRedeem} from "../../token/ERC20/extensions/ERC7540SyncRedeem.sol";
import {ERC7540AdminDeposit} from "../../token/ERC20/extensions/ERC7540AdminDeposit.sol";

abstract contract ERC7540SyncRedeemMock is ERC7540SyncRedeem, ERC7540AdminDeposit {
    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540AdminDeposit) {
        super._requestDeposit(assets, controller, owner, requestId);
    }
}
