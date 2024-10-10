// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (utils/Bytes.sol)
pragma solidity ^0.8.4;

/**
 * @dev Provides a set of functions to operate with packed data in bytes array.
 *
 * _Available since v4.8.1
 */
library Bytes {
  /**
   * @dev Read uint from input bytes array
   */
  function _readUint(bytes memory input, uint256 offset, uint256 length) private pure returns (uint256 result) {
    require(offset + length <= input.length, "Bytes: Out of range");
    assembly {
      // Read 256 bits at the given offset
      result := mload(add(add(input, 0x20), offset))
    }
  }

  /**
   * @dev Convert bytes to bytes32 array
   */
  function toBytes32Array(bytes memory input) internal pure returns (bytes32[] memory) {
    require(input.length % 32 == 0, "Bytes: Invalid input length");
    bytes32[] memory result = new bytes32[](input.length / 32);
    assembly {
      // Read length of input
      let length := mload(input)

      // Seek offset to the beginning
      let offset := add(input, 0x20)

      // Point result offset to the beginging 
      let resultOffset := add(result, 0x20)

      for {
        let i := 0
      } lt(i, length) {
        i := add(i, 0x20)
      } {
        // Copy 32 bytes to bytes32 array
        mstore(resultOffset, mload(add(offset, i)))
        // resultOffset += 32
        resultOffset := add(resultOffset, 0x20)
      }
    }
    return result;
  }

  /**
   * @dev Read sub bytes array from input bytes array
   */
  function readBytes(bytes memory input, uint256 offset, uint256 length) internal pure returns (bytes memory result, uint256 nextOffset) {
    nextOffset = offset + length;
    require(nextOffset <= input.length, "Bytes: Out of range");
    result = new bytes(length);
    assembly {
      // Set seek to the given offset of the input
      let seek := add(add(input, 0x20), offset)
      let resultOffset := add(result, 0x20)

      for {
        let i := 0
      } lt(i, length) {
        i := add(i, 0x20)
      } {
        mstore(add(resultOffset, i), mload(add(seek, i)))
      }
    }
  }

  /**
   * @dev Read uint256 from input bytes array
   */
  function readUint256(bytes memory input, uint256 offset) internal pure returns (uint256 result, uint256 nextOffset) {
    return (_readUint(input, offset, 32), offset + 32);
  }
    
  /**
   * @dev Read uint160 from input bytes array
   */
  function readUint160(bytes memory input, uint256 offset) internal pure returns (uint160 result,uint256 nextOffset) {
    return (uint160(_readUint(input, offset, 20) >> 96), offset + 20);
  }

  /**
   * @dev Read uint128 from input bytes array
   */
  function readUint128(bytes memory input, uint256 offset) internal pure returns (uint128 result,uint256 nextOffset) {
    return (uint128(_readUint(input, offset, 16) >> 128), offset + 16);
  }

  /**
   * @dev Read uint64 from input bytes array
   */
  function readUint64(bytes memory input, uint256 offset) internal pure returns (uint64 result,uint256 nextOffset) {
    return (uint64(_readUint(input, offset, 8) >> 192), offset + 8);
  }

  /**
   * @dev Read uint32 from input bytes array
   */
  function readUint32(bytes memory input, uint256 offset) internal pure returns (uint32 result,uint256 nextOffset) {
    return (uint32(_readUint(input, offset, 4) >> 224), offset + 4);
  }

  /**
   * @dev Read uint16 from input bytes array
   */
  function readUint16(bytes memory input, uint256 offset) internal pure returns (uint16 result,uint256 nextOffset) {
    return (uint16(_readUint(input, offset, 2) >> 240), offset + 2);
  }
}
