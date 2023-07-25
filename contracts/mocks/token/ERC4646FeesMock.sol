// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC4626Fees} from "../docs/ERC4626Fees.sol";

abstract contract ERC4626FeesMock is ERC4626Fees {
    uint256 private immutable _entryFeePCMValue;
    address private immutable _entryFeeRecipientValue;
    uint256 private immutable _exitFeePCMValue;
    address private immutable _exitFeeRecipientValue;

    constructor(uint256 entryFeePCM, address entryFeeRecipient, uint256 exitFeePCM, address exitFeeRecipient) {
        _entryFeePCMValue = entryFeePCM;
        _entryFeeRecipientValue = entryFeeRecipient;
        _exitFeePCMValue = exitFeePCM;
        _exitFeeRecipientValue = exitFeeRecipient;
    }

    function _entryFeePCM() internal view virtual override returns (uint256) {
        return _entryFeePCMValue;
    }

    function _entryFeeRecipient() internal view virtual override returns (address) {
        return _entryFeeRecipientValue;
    }

    function _exitFeePCM() internal view virtual override returns (uint256) {
        return _exitFeePCMValue;
    }

    function _exitFeeRecipient() internal view virtual override returns (address) {
        return _exitFeeRecipientValue;
    }
}
