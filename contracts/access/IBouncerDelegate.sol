pragma solidity 0.4.24;

import "../introspection/ERC165.sol";

/**
 * @title IBouncerDelegate
 * @dev Implement this interface so that your contract can be a Bouncer's delegate.
 * inspired by https://github.com/0xProject/0x-monorepo/blob/v2-prototype/packages/contracts/src/2.0.0/protocol/Exchange/interfaces/IWallet.sol
 */
contract IBouncerDelegate is ERC165 {

  bytes4 internal constant InterfaceId_BouncerDelegate = 0x1626ba7e;
  /**
   * 0x1626ba7e ===
   *   bytes4(keccak256('isValidSignature(bytes32,bytes)'))
   */

  /**
   * @dev verifies that a signature of a hash is valid
   * @param _hash message hash that is signed
   * @param _sig the provided signature
   * @return bool validity of signature for the hash
   */
  function isValidSignature(
    bytes32 _hash,
    bytes _sig
  )
    external
    view
    returns (bool);
}
