// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC7540EpochDeposit} from "../../token/ERC20/extensions/ERC7540EpochDeposit.sol";
import {ERC7540EpochRedeem} from "../../token/ERC20/extensions/ERC7540EpochRedeem.sol";

abstract contract ERC7540EpochMock is ERC7540EpochDeposit, ERC7540EpochRedeem {
    address private immutable _tmpShareHolder;

    constructor(address tmpShareHolder) {
        _tmpShareHolder = tmpShareHolder;
    }

    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540EpochDeposit) {
        super._requestDeposit(assets, controller, owner, requestId);
    }

    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540EpochRedeem) {
        super._requestRedeem(shares, controller, owner, requestId);
    }

    function _depositShareOrigin() internal view virtual override returns (address) {
        return _tmpShareHolder;
    }

    function _redeemShareDestination() internal view virtual override returns (address) {
        return _tmpShareHolder;
    }
}
