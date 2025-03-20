// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Library with common EIP-7702 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-7702[ERC-7702].
 */
library EIP7702Utils {
    bytes3 internal constant EIP7702_PREFIX = 0xef0100;

    function fetchDelegate(address account) internal view returns (bool isEIP7702, address delegate) {
        bytes23 delegation = bytes23(account.code);

        isEIP7702 = bytes3(delegation) == EIP7702_PREFIX;
        delegate = isEIP7702 ? address(bytes20(delegation << 24)) : address(0);
    }
}
