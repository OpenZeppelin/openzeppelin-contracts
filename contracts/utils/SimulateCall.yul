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
      let cds := calldatasize()
      if lt(cds, 0x34) { revert(0, 0) }
      let len := sub(cds, 0x34)
      calldatacopy(0x00, 0x34, len)
      let suc := call(gas(), shr(0x60, calldataload(0x00)), calldataload(0x14), 0x00, len, 0x00, 0x00)
      let rds := returndatasize()
      if suc {
        returndatacopy(0x00, 0x00, rds)
        revert(0, rds)
      }
      // else
      {
        returndatacopy(0x00, 0x00, rds)
        return(0, rds)
      }
    }
  }
}
