pragma solidity ^0.4.24;

/**
 * @dev implements EIP 1154 (draft) https://github.com/ethereum/EIPs/issues/1161
 */
interface Oracle {
  /**
   * Returns stored result
   */
  function resultFor(bytes32 id) external view returns (bytes result);
}
