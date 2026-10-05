// SPDX-License-Identifier: MIT

/// @dev Call simulator deployed via CREATE2 and delegatecalled by {SimulateCall}.
object "SimulationRelayer" {
  /// @dev Constructor: returns the runtime object as the deployed code.
  code {
    let size := datasize("runtime")
    datacopy(0, dataoffset("runtime"), size)
    return(0, size)
  }
  object "runtime" {
    /// @dev Runs the target call and inverts the result.
    /// - Reverts on success (undoing state).
    /// - Returns on failure.
    /// Calldata layout: target[0x00:0x14] | value[0x14:0x34] | data[0x34:]
    code {
      if lt(calldatasize(), 0x34) { revert(0x00, 0x00) }
      let len := sub(calldatasize(), 0x34)
      calldatacopy(0x00, 0x34, len)
      let success := call(gas(), shr(0x60, calldataload(0x00)), calldataload(0x14), 0x00, len, 0x00, 0x00)
      returndatacopy(0x00, 0x00, returndatasize())
      if success { revert(0x00, returndatasize()) }
      /* else */ { return(0x00, returndatasize()) }
    }
  }
}
