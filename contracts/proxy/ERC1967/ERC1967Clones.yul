// SPDX-License-Identifier: MIT

/// @dev Minimal ERC-1967 proxy deployed by {ERC1967Clones}.
object "ERC1967Clone" {
  /// @dev Constructor: stores the implementation in the ERC-1967 implementation slot, emits {IERC1967-Upgraded} and
  /// returns the runtime object as the deployed code.
  /// The implementation address is expected to be ABI-encoded (32 bytes) and appended to the initcode.
  code {
    let size := datasize("runtime")
    datacopy(0x00, dataoffset("runtime"), size)
    codecopy(size, datasize("ERC1967Clone"), 0x20)
    let implementation := mload(size)
    // ERC1967Utils.IMPLEMENTATION_SLOT
    sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, implementation)
    // IERC1967.Upgraded.selector
    log2(0x00, 0x00, 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b, implementation)
    return(0x00, size)
  }
  object "runtime" {
    /// @dev Delegates the call to the implementation stored in the ERC-1967 implementation slot, and bubbles up
    /// the result.
    code {
      calldatacopy(0x00, 0x00, calldatasize())
      let success := delegatecall(
        gas(),
        // ERC1967Utils.IMPLEMENTATION_SLOT
        sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc),
        0x00,
        calldatasize(),
        0x00,
        0x00
      )
      returndatacopy(0x00, 0x00, returndatasize())
      if success {
        return(0x00, returndatasize())
      } /* else */ {
        revert(0x00, returndatasize())
      }
    }
  }
}
