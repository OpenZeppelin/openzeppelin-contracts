// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {Math} from "./math/Math.sol";
import {SafeCast} from "./math/SafeCast.sol";
import {Bytes} from "./Bytes.sol";
import {Calldata} from "./Calldata.sol";

/**
 * @dev Helper library to format and parse https://ethereum-magicians.org/t/erc-7930-interoperable-addresses/23365[ERC-7930] interoperable
 * addresses.
 */
library InteroperableAddress {
    using SafeCast for uint256;
    using Bytes for bytes;

    error InteroperableAddressParsingError(bytes);
    error InteroperableAddressEmptyReferenceAndAddress();

    /**
     * @dev Format an ERC-7930 interoperable address (version 1) from its components `chainType`, `chainReference`
     * and `addr`. This is a generic function that supports any chain type, chain reference and address supported by
     * ERC-7390, including interoperable addresses with empty chain reference or empty address.
     */
    function formatV1(
        bytes2 chainType,
        bytes memory chainReference,
        bytes memory addr
    ) internal pure returns (bytes memory) {
        require(chainReference.length > 0 || addr.length > 0, InteroperableAddressEmptyReferenceAndAddress());
        return
            abi.encodePacked(
                bytes2(0x0001),
                chainType,
                chainReference.length.toUint8(),
                chainReference,
                addr.length.toUint8(),
                addr
            );
    }

    /**
     * @dev Variant of {formatV1-bytes2-bytes-bytes-} specific to EVM chains. Returns the ERC-7930 interoperable
     * address (version 1) for a given chainid and ethereum address.
     */
    function formatEvmV1(uint256 chainid, address addr) internal pure returns (bytes memory) {
        bytes memory chainReference = _toChainReference(chainid);
        return abi.encodePacked(bytes4(0x00010000), uint8(chainReference.length), chainReference, uint8(20), addr);
    }

    /**
     * @dev Variant of {formatV1-bytes2-bytes-bytes-} that specifies an EVM chain without an address.
     */
    function formatEvmV1(uint256 chainid) internal pure returns (bytes memory) {
        bytes memory chainReference = _toChainReference(chainid);
        return abi.encodePacked(bytes4(0x00010000), uint8(chainReference.length), chainReference, uint8(0));
    }

    /**
     * @dev Variant of {formatV1-bytes2-bytes-bytes-} that specifies an EVM address without a chain reference.
     */
    function formatEvmV1(address addr) internal pure returns (bytes memory) {
        return abi.encodePacked(bytes6(0x000100000014), addr);
    }

    /**
     * @dev Parse a ERC-7930 interoperable address (version 1) into its different components. Reverts if the input is
     * not following a version 1 of ERC-7930
     */
    function parseV1(
        bytes memory self
    ) internal pure returns (bytes2 chainType, bytes memory chainReference, bytes memory addr) {
        bool success;
        (success, chainType, chainReference, addr) = tryParseV1(self);
        require(success, InteroperableAddressParsingError(self));
    }

    /**
     * @dev Variant of {parseV1} that handles calldata slices to reduce memory copy costs.
     */
    function parseV1Calldata(
        bytes calldata self
    ) internal pure returns (bytes2 chainType, bytes calldata chainReference, bytes calldata addr) {
        bool success;
        (success, chainType, chainReference, addr) = tryParseV1Calldata(self);
        require(success, InteroperableAddressParsingError(self));
    }

    /**
     * @dev Variant of {parseV1} that does not revert on invalid input. Instead, it returns `false` as the first
     * return value to indicate parsing failure when the input does not follow version 1 of ERC-7930.
     */
    function tryParseV1(
        bytes memory self
    ) internal pure returns (bool success, bytes2 chainType, bytes memory chainReference, bytes memory addr) {
        unchecked {
            success = true;
            if (self.length < 0x06) return (false, 0x0000, _emptyBytesMemory(), _emptyBytesMemory());

            bytes2 version = _readBytes2(self, 0x00);
            if (version != bytes2(0x0001)) return (false, 0x0000, _emptyBytesMemory(), _emptyBytesMemory());
            chainType = _readBytes2(self, 0x02);

            uint8 chainReferenceLength = uint8(self[0x04]);
            if (self.length < 0x06 + chainReferenceLength)
                return (false, 0x0000, _emptyBytesMemory(), _emptyBytesMemory());
            chainReference = self.slice(0x05, 0x05 + chainReferenceLength);

            uint8 addrLength = uint8(self[0x05 + chainReferenceLength]);
            if (self.length < 0x06 + chainReferenceLength + addrLength)
                return (false, 0x0000, _emptyBytesMemory(), _emptyBytesMemory());
            addr = self.slice(0x06 + chainReferenceLength, 0x06 + chainReferenceLength + addrLength);
        }
    }

    /**
     * @dev Variant of {tryParseV1} that handles calldata slices to reduce memory copy costs.
     */
    function tryParseV1Calldata(
        bytes calldata self
    ) internal pure returns (bool success, bytes2 chainType, bytes calldata chainReference, bytes calldata addr) {
        unchecked {
            success = true;
            if (self.length < 0x06) return (false, 0x0000, Calldata.emptyBytes(), Calldata.emptyBytes());

            bytes2 version = _readBytes2Calldata(self, 0x00);
            if (version != bytes2(0x0001)) return (false, 0x0000, Calldata.emptyBytes(), Calldata.emptyBytes());
            chainType = _readBytes2Calldata(self, 0x02);

            uint8 chainReferenceLength = uint8(self[0x04]);
            if (self.length < 0x06 + chainReferenceLength)
                return (false, 0x0000, Calldata.emptyBytes(), Calldata.emptyBytes());
            chainReference = self[0x05:0x05 + chainReferenceLength];

            uint8 addrLength = uint8(self[0x05 + chainReferenceLength]);
            if (self.length < 0x06 + chainReferenceLength + addrLength)
                return (false, 0x0000, Calldata.emptyBytes(), Calldata.emptyBytes());
            addr = self[0x06 + chainReferenceLength:0x06 + chainReferenceLength + addrLength];
        }
    }

    /**
     * @dev Parse a ERC-7930 interoperable address (version 1) corresponding to an EIP-155 chain. The `chainId` and
     * `addr` return values will be zero if the input doesn't include a chainReference or an address, respectively.
     *
     * Requirements:
     *
     * * The input must be a valid ERC-7930 interoperable address (version 1)
     * * The underlying chainType must be "eip-155"
     */
    function parseEvmV1(bytes memory self) internal pure returns (uint256 chainId, address addr) {
        bool success;
        (success, chainId, addr) = tryParseEvmV1(self);
        require(success, InteroperableAddressParsingError(self));
    }

    /**
     * @dev Variant of {parseEvmV1} that handles calldata slices to reduce memory copy costs.
     */
    function parseEvmV1Calldata(bytes calldata self) internal pure returns (uint256 chainId, address addr) {
        bool success;
        (success, chainId, addr) = tryParseEvmV1Calldata(self);
        require(success, InteroperableAddressParsingError(self));
    }

    /**
     * @dev Variant of {parseEvmV1} that does not revert on invalid input. Instead, it returns `false` as the first
     * return value to indicate parsing failure when the input does not follow version 1 of ERC-7930.
     */
    function tryParseEvmV1(bytes memory self) internal pure returns (bool success, uint256 chainId, address addr) {
        (bool success_, bytes2 chainType_, bytes memory chainReference_, bytes memory addr_) = tryParseV1(self);
        return
            (success_ &&
                chainType_ == 0x0000 &&
                chainReference_.length < 33 &&
                (addr_.length == 0 || addr_.length == 20))
                ? (
                    true,
                    uint256(bytes32(chainReference_)) >> (256 - 8 * chainReference_.length),
                    address(bytes20(addr_))
                )
                : (false, 0, address(0));
    }

    /**
     * @dev Variant of {tryParseEvmV1} that handles calldata slices to reduce memory copy costs.
     */
    function tryParseEvmV1Calldata(
        bytes calldata self
    ) internal pure returns (bool success, uint256 chainId, address addr) {
        (bool success_, bytes2 chainType_, bytes calldata chainReference_, bytes calldata addr_) = tryParseV1Calldata(
            self
        );
        return
            (success_ &&
                chainType_ == 0x0000 &&
                chainReference_.length < 33 &&
                (addr_.length == 0 || addr_.length == 20))
                ? (
                    true,
                    uint256(bytes32(chainReference_)) >> (256 - 8 * chainReference_.length),
                    address(bytes20(addr_))
                )
                : (false, 0, address(0));
    }

    function _toChainReference(uint256 chainid) private pure returns (bytes memory) {
        unchecked {
            // length fits in a uint8: log256(type(uint256).max) is 31
            uint256 length = Math.log256(chainid) + 1;
            return abi.encodePacked(chainid).slice(32 - length);
        }
    }

    function _readBytes2(bytes memory buffer, uint256 offset) private pure returns (bytes2 value) {
        // This is not memory safe in the general case, but all calls to this private function are within bounds.
        assembly ("memory-safe") {
            value := shl(240, shr(240, mload(add(add(buffer, 0x20), offset))))
        }
    }

    function _readBytes2Calldata(bytes calldata buffer, uint256 offset) private pure returns (bytes2 value) {
        assembly ("memory-safe") {
            value := shl(240, shr(240, calldataload(add(buffer.offset, offset))))
        }
    }

    function _emptyBytesMemory() private pure returns (bytes memory result) {
        assembly ("memory-safe") {
            result := 0x60 // mload(0x60) is always 0
        }
    }
}
