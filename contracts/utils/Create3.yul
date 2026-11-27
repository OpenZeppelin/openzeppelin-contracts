// SPDX-License-Identifier: MIT

/// @dev Proxy deployed via CREATE2 by {Create3}, that deploys the calldata (as initcode) using CREATE.
object "Create3Proxy" {
  /// @dev Constructor: returns the runtime object as the deployed code.
  code {
    datacopy(0x00, dataoffset("runtime"), datasize("runtime"))
    return(0x00, datasize("runtime"))
  }
  object "runtime" {
    /// @dev Deploys the calldata using CREATE, forwarding the value. Bubbles up the revert data on failure.
    code {
      calldatacopy(0x00, 0x00, calldatasize())
      if iszero(create(callvalue(), 0x00, calldatasize())) {
        returndatacopy(0x00, 0x00, returndatasize())
        revert(0x00, returndatasize())
      }
    }
  }
}
