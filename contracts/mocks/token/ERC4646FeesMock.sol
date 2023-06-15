// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../docs/ERC4626Fees.sol";

abstract contract ERC4626FeesMock is ERC4626Fees {
    uint256 private immutable _entryFeeBasePointValue;
    address private immutable _entryFeeRecipientValue;
    uint256 private immutable _exitFeeBasePointValue;
    address private immutable _exitFeeRecipientValue;

    constructor(
        uint256 entryFeeBasePoint,
        address entryFeeRecipient,
        uint256 exitFeeBasePoint,
        address exitFeeRecipient
    ) {
        _entryFeeBasePointValue = entryFeeBasePoint;
        _entryFeeRecipientValue = entryFeeRecipient;
        _exitFeeBasePointValue = exitFeeBasePoint;
        _exitFeeRecipientValue = exitFeeRecipient;
    }

    function _entryFeeBasePoint() internal view virtual override returns (uint256) {
        return _entryFeeBasePointValue;
    }

    function _entryFeeRecipient() internal view virtual override returns (address) {
        return _entryFeeRecipientValue;
    }

    function _exitFeeBasePoint() internal view virtual override returns (uint256) {
        return _exitFeeBasePointValue;
    }

    function _exitFeeRecipient() internal view virtual override returns (address) {
        return _exitFeeRecipientValue;
    }
}
