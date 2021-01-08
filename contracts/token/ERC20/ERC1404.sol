// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./IERC1404.sol";
import "../../utils/Strings.sol";

/**
 * @title ERC-1404: Simple Restricted Token Standard
 * @dev see https://github.com/ethereum/eips/issues/1404
 */
abstract contract ERC1404 is ERC20, IERC1404 {
    /**
     * @dev Implement transfer restriction codes. Override this function to
     * implement your restriction policy.
     */
    function detectTransferRestriction(address /*from*/, address /*to*/, uint256 /*amount*/) public virtual override view returns (uint8) {
        return uint8(0);
    }

    /**
     * @dev Provides error messages for each restriction codes. Override this
     * function to return meaningfull revert reasons.
     */
    function messageForTransferRestriction(uint8 restrictionCode) public virtual override view returns (string memory) {
        return string(abi.encodePacked("ERC1404: Transfer restriction with code ", Strings.toString(uint256(restrictionCode))));
    }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - transfer must abide by the transfer restriction rules.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        uint8 restrictionCode = detectTransferRestriction(from, to, amount);
        if (restrictionCode != uint8(0)) {
            revert(messageForTransferRestriction(restrictionCode));
        }
        super._beforeTokenTransfer(from, to, amount);
    }
}
