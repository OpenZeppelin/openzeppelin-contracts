// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.0) (account/utils/EIP7702Utils.sol)

pragma solidity ^0.8.20;

/**
 * @dev Library with common EIP-7702 utility functions.
 *
 * See https://eips.ethereum.org/EIPS/eip-7702[EIP-7702].
 */
library EIP7702Utils {
    bytes3 internal constant EIP7702_PREFIX = 0xef0100;

    /**
     * @dev Returns the address of the delegate if `account` has an EIP-7702 delegation setup, or address(0) otherwise.
     *
     * NOTE: Only the first word of `account`'s code is read, so the cost does not depend on the size of that code.
     */
    function fetchDelegate(address account) internal view returns (address) {
        bytes32 word;
        assembly ("memory-safe") {
            extcodecopy(account, 0x00, 0x00, 0x20)
            word := mload(0x00)
        }
        // A delegation designator is 23 bytes. `extcodecopy` zero-pads, so shorter code can't match the prefix.
        bytes23 delegation = bytes23(word);
        return bytes3(delegation) == EIP7702_PREFIX ? address(bytes20(delegation << 24)) : address(0);
    }
}
