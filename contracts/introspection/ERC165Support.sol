pragma solidity ^0.4.21;

import "./ERC165.sol";

/**
 * @title ERC165Support
 * @dev Implements ERC165 returning true for ERC165 interface identifier
 */
contract ERC165Support is ERC165 {

  bytes4 internal constant InterfaceId_ERC165 = 0x01ffc9a7;
  /**
   * 0x01ffc9a7 ===
   *   bytes4(keccak256('supportsInterface(bytes4)'))
   */

  function supportsInterface(bytes4 _interfaceId)
    external
    view
    returns (bool) 
  {
    return _supportsInterface(_interfaceId);
  }

  function _supportsInterface(bytes4 _interfaceId)
    internal
    view
    returns (bool) 
  {
    return _interfaceId == InterfaceId_ERC165;
  }
}
