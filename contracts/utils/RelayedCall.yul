// SPDX-License-Identifier: MIT

/// @dev Call relayer deployed via CREATE2 and called by {RelayedCall}.
object "Relayer" {
  /// @dev Constructor: returns the runtime object as the deployed code, with the factory address set as an immutable.
  /// The factory address is expected to be ABI-encoded (32 bytes) and appended to the initcode.
  code {
    let size := datasize("runtime")
    datacopy(0x00, dataoffset("runtime"), size)
    codecopy(size, datasize("Relayer"), 0x20)
    setimmutable(0x00, "factory", mload(size))
    return(0x00, size)
  }
  object "runtime" {
    /// @dev Relays the call to the target, forwarding the value, and bubbles up the result.
    /// Reverts with empty data if the caller is not the factory, or if the calldata is shorter than 0x14 bytes.
    /// Calldata layout: target[0x00:0x14] | data[0x14:]
    code {
      if or(iszero(eq(caller(), loadimmutable("factory"))), lt(calldatasize(), 0x14)) {
        revert(0x00, 0x00)
      }
      let len := sub(calldatasize(), 0x14)
      calldatacopy(0x00, 0x14, len)
      let success := call(gas(), shr(0x60, calldataload(0x00)), callvalue(), 0x00, len, 0x00, 0x00)
      returndatacopy(0x00, 0x00, returndatasize())
      if success {
        return(0x00, returndatasize())
      } /* else */ {
        revert(0x00, returndatasize())
      }
    }
  }
}
