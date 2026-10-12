// SPDX-License-Identifier: MIT

/// @dev Call simulator deployed via CREATE2 and delegatecalled by {SimulateCall}.
object "SimulationRelayer" {
  /// @dev Constructor: returns the runtime object as the deployed code.
  code {
    datacopy(0, dataoffset("runtime"), datasize("runtime"))
    return(0, datasize("runtime"))
  }
  object "runtime" {
    /// @dev Runs the target call and inverts the result.
    /// - Reverts on success (undoing state).
    /// - Returns on failure.
    /// Calldata layout: target[0x00:0x14] | value[0x14:0x34] | data[0x34:]
    ///
    /// WARNING: Behavior is undefined if the calldata is shorter than 0x34 bytes. In that case, the length
    /// computation underflows and the `calldatacopy` attempts to expand memory to an unreasonable size,
    /// which in practice runs out of gas.
    code {
      let len := sub(calldatasize(), 0x34)
      calldatacopy(0x00, 0x34, len)
      let success := call(gas(), shr(0x60, calldataload(0x00)), calldataload(0x14), 0x00, len, 0x00, 0x00)
      returndatacopy(0x00, 0x00, returndatasize())
      if success { revert(0x00, returndatasize()) }
      /* else */ { return(0x00, returndatasize()) }
    }
  }
}
