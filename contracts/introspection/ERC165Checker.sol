pragma solidity ^0.4.24;


/**
 * @title ERC165Checker
 * @dev Use `using ERC165Checker for address`; to include this library
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
 */
library ERC165Checker {
  // As per the EIP-165 spec, no interface should ever match 0xffffffff
  bytes4 private constant InterfaceId_Invalid = 0xffffffff;

  bytes4 private constant InterfaceId_ERC165 = 0x01ffc9a7;
  /**
   * 0x01ffc9a7 ===
   *   bytes4(keccak256('supportsInterface(bytes4)'))
   */


  /**
   * @notice Query if a contract supports ERC165
   * @param _address The address of the contract to query for support of ERC165
   * @return true if the contract at _address implements ERC165
   */
  function supportsERC165(address _address)
    internal
    view
    returns (bool)
  {
    // Any contract that implements ERC165 must explicitly indicate support of
    // InterfaceId_ERC165 and explicitly indicate non-support of InterfaceId_Invalid
    return supportsERC165Interface(_address, InterfaceId_ERC165) &&
      !supportsERC165Interface(_address, InterfaceId_Invalid);
  }

  /**
   * @notice Query if a contract implements an interface, also checks support of ERC165
   * @param _address The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return true if the contract at _address indicates support of the interface with
   * identifier _interfaceId, false otherwise
   * @dev Interface identification is specified in ERC-165.
   */
  function supportsInterface(address _address, bytes4 _interfaceId)
    internal
    view
    returns (bool)
  {
    // query support of both ERC165 as per the spec and support of _interfaceId
    return supportsERC165(_address) &&
      supportsERC165Interface(_address, _interfaceId);
  }

  /**
   * @notice Query if a contract implements interfaces, also checks support of ERC165
   * @param _address The address of the contract to query for support of an interface
   * @param _interfaceIds A list of interface identifiers, as specified in ERC-165
   * @return true if the contract at _address indicates support all interfaces in the
   * _interfaceIds list, false otherwise
   * @dev Interface identification is specified in ERC-165.
   */
  function supportsInterfaces(address _address, bytes4[] _interfaceIds)
    internal
    view
    returns (bool)
  {
    // query support of ERC165 itself
    if (!supportsERC165(_address)) {
      return false;
    }

    // query support of each interface in _interfaceIds
    for (uint256 i = 0; i < _interfaceIds.length; i++) {
      if (!supportsERC165Interface(_address, _interfaceIds[i])) {
        return false;
      }
    }

    // all interfaces supported
    return true;
  }

  /**
   * @notice Query if a contract implements an interface, does not check ERC165 support
   * @param _address The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return true if the contract at _address indicates support of the interface with
   * identifier _interfaceId, false otherwise
   * @dev Assumes that _address contains a contract that supports ERC165, otherwise
   * the behavior of this method is undefined. This precondition can be checked
   * with the `supportsERC165` method in this library.
   * Interface identification is specified in ERC-165.
   */
  function supportsERC165Interface(address _address, bytes4 _interfaceId)
    private
    view
    returns (bool)
  {
    // success determines whether the staticcall succeeded and result determines
    // whether the contract at _address indicates support of _interfaceId
    (bool success, bool result) = callERC165SupportsInterface(
      _address, _interfaceId);

    return (success && result);
  }

  /**
   * @notice Calls the function with selector 0x01ffc9a7 (ERC165) and suppresses throw
   * @param _address The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return success true if the STATICCALL succeeded, false otherwise
   * @return result true if the STATICCALL succeeded and the contract at _address
   * indicates support of the interface with identifier _interfaceId, false otherwise
   */
  function callERC165SupportsInterface(
    address _address,
    bytes4 _interfaceId
  )
    private
    view
    returns (bool success, bool result)
  {
    bytes memory encodedParams = abi.encodeWithSelector(
      InterfaceId_ERC165,
      _interfaceId
    );

    // solium-disable-next-line security/no-inline-assembly
    assembly {
      let encodedParams_data := add(0x20, encodedParams)
      let encodedParams_size := mload(encodedParams)

      let output := mload(0x40)  // Find empty storage location using "free memory pointer"
      mstore(output, 0x0)

      success := staticcall(
        30000,                 // 30k gas
        _address,              // To addr
        encodedParams_data,
        encodedParams_size,
        output,
        0x20                   // Outputs are 32 bytes long
      )

      result := mload(output)  // Load the result
    }
  }
}

