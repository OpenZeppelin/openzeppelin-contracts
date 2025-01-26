// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC7540Fees} from "../docs/ERC7540Fees.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {IERC20} from "../../token/ERC20/IERC20.sol";

abstract contract ERC7540FeesMock is ERC7540Fees {
    uint256 private immutable _entryFeeBasisPointValue;
    address private immutable _entryFeeRecipientValue;
    uint256 private immutable _exitFeeBasisPointValue;
    address private immutable _exitFeeRecipientValue;

    constructor(
        IERC20 asset,
        uint256 entryFeeBasisPoints,
        address entryFeeRecipient,
        uint256 exitFeeBasisPoints,
        address exitFeeRecipient
    ) ERC7540(asset) {
        _entryFeeBasisPointValue = entryFeeBasisPoints;
        _entryFeeRecipientValue = entryFeeRecipient;
        _exitFeeBasisPointValue = exitFeeBasisPoints;
        _exitFeeRecipientValue = exitFeeRecipient;
    }

    function _entryFeeBasisPoints() internal view virtual override returns (uint256) {
        return _entryFeeBasisPointValue;
    }

    function _entryFeeRecipient() internal view virtual override returns (address) {
        return _entryFeeRecipientValue;
    }

    function _exitFeeBasisPoints() internal view virtual override returns (uint256) {
        return _exitFeeBasisPointValue;
    }

    function _exitFeeRecipient() internal view virtual override returns (address) {
        return _exitFeeRecipientValue;
    }
}
