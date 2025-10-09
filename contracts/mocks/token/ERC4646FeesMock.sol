// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4626Fees} from "../docs/ERC4626Fees.sol";

abstract contract ERC4626FeesMock is ERC4626Fees {
    uint256 private immutable _entryFeeBasisPointValue;
    address private immutable _entryFeeRecipientValue;
    uint256 private immutable _exitFeeBasisPointValue;
    address private immutable _exitFeeRecipientValue;

    constructor(
        uint256 entryFeeBasisPoints,
        address entryFeeRecipient,
        uint256 exitFeeBasisPoints,
        address exitFeeRecipient
    ) {
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
