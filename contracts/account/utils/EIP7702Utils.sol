// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Library with common EIP-7702 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-7702[ERC-7702].
 */
library EIP7702Utils {
    bytes3 internal constant EIP7702_PREFIX = 0xef0100;

    /**
     * @dev Returns the address of the delegate if `account` as an EIP-7702 delegation setup, or address(0) otherwise.
     */
    function fetchDelegate(address account) internal view returns (address) {
        bytes23 delegation = bytes23(account.code);
        return bytes3(delegation) == EIP7702_PREFIX ? address(bytes20(delegation << 24)) : address(0);
    }
}
