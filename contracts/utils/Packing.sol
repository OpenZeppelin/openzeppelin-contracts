// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Helper library packing and unpacking multiple values into bytes32
 */
library Packing {
    type Uint128x2 is bytes32;

    /// @dev Cast a bytes32 into a Uint128x2
    function asUint128x2(bytes32 self) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(self);
    }

    /// @dev Cast a bytes32 into a Uint128x2
    function asUint128x2(uint256 self) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(bytes32(self));
    }

    /// @dev Cast a Uint128x2 into a bytes32
    function asBytes32(Uint128x2 self) internal pure returns (bytes32) {
        return Uint128x2.unwrap(self);
    }

    /// @dev Cast a Uint128x2 into a bytes32
    function asUint256(Uint128x2 self) internal pure returns (uint256) {
        return uint256(Uint128x2.unwrap(self));
    }

    /// @dev Pack two uint128 into a Uint128x2
    function pack(uint128 first128, uint128 second128) internal pure returns (Uint128x2) {
        return Uint128x2.wrap(bytes32(bytes16(first128)) | bytes32(uint256(second128)));
    }

    /// @dev Split a Uint128x2 into two uint128
    function split(Uint128x2 self) internal pure returns (uint128, uint128) {
        return (first(self), second(self));
    }

    /// @dev Get the first element of a Uint128x2 counting from higher to lower bytes
    function first(Uint128x2 self) internal pure returns (uint128) {
        return uint128(bytes16(Uint128x2.unwrap(self)));
    }

    /// @dev Get the second element of a Uint128x2 counting from higher to lower bytes
    function second(Uint128x2 self) internal pure returns (uint128) {
        return uint128(uint256(Uint128x2.unwrap(self)));
    }

    type AddressUint48x2 is bytes32;

    /// @dev Cast a bytes32 into a AddressUint48x2
    function asAddressUint48x2(bytes32 self) internal pure returns (AddressUint48x2) {
        return AddressUint48x2.wrap(self);
    }

    /// @dev Cast a uint256 into a AddressUint48x2
    function asAddressUint48x2(uint256 self) internal pure returns (AddressUint48x2) {
        return AddressUint48x2.wrap(bytes32(self));
    }

    /// @dev Cast a AddressUint48x2 into a bytes32
    function asBytes32(AddressUint48x2 self) internal pure returns (bytes32) {
        return AddressUint48x2.unwrap(self);
    }

    /// @dev Cast a AddressUint48x2 into a uint256
    function asUint256(AddressUint48x2 self) internal pure returns (uint256) {
        return uint256(AddressUint48x2.unwrap(self));
    }

    /// @dev Pack two uint128 into a AddressUint48x2
    function pack(address first160, uint48 second48, uint48 third48) internal pure returns (AddressUint48x2) {
        return AddressUint48x2.wrap(bytes32(
            uint256(uint160(first160)) |
            uint256(second48) << 160 |
            uint256(third48) << 208
        ));
    }

    /// @dev Split a AddressUint48x2 into two uint128
    function split(AddressUint48x2 self) internal pure returns (address, uint48, uint48) {
        return (first(self), second(self), third(self));
    }

    /// @dev Get the first element (address) of a AddressUint48x2
    function first(AddressUint48x2 self) internal pure returns (address) {
        return address(uint160(uint256(AddressUint48x2.unwrap(self))));
    }

    /// @dev Get the second element (uint48) of a AddressUint48x2
    function second(AddressUint48x2 self) internal pure returns (uint48) {
        return uint48(uint256(AddressUint48x2.unwrap(self)) >> 160);
    }

    /// @dev Get the second element (uint48) of a AddressUint48x2
    function third(AddressUint48x2 self) internal pure returns (uint48) {
        return uint48(uint256(AddressUint48x2.unwrap(self)) >> 208);
    }
}
