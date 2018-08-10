pragma solidity ^0.4.24;

/**
 * @dev implements EIP 1154 (draft) https://github.com/ethereum/EIPs/issues/1161
 */
interface OracleHandler {
  /**
   * Receives data from an oracle
   */
  function receiveResult(bytes32 id, bytes32 result) external;
}
