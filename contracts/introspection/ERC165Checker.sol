pragma solidity ^0.4.24;


/**
 * @title ERC165Checker
 * @dev Use `using ERC165Checker for address`; to include this library
 *      https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
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
   * @notice Query if a contract implements an interface, does not check ERC165 support
   * @param _address The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return true if the contract at _address indicates support of the interface with
   * identifier _interfaceId, false otherwise
   * @dev Assumes that _address contains a contract that supports ERC165, otherwise
   *      the behavior of this method is undefined. This precondition can be checked 
   *      with the `supportsERC165` method in this library. 
   *      Interface identification is specified in ERC-165.
   */
  function supportsERC165Interface(address _address, bytes4 _interfaceId)
    internal
    view
    returns (bool)
  {
    // success determines whether the staticcall succeeded and result determines
    // whether the contract at _address indicates support of _interfaceId
    (bool success, bool result) = noThrowCall(_address, _interfaceId);

    return (success && result);
  }

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
    return supportsERC165(_address) && supportsERC165Interface(_address, _interfaceId);
  }

  /**
   * @notice Calls the function with selector 0x01ffc9a7 (ERC165) and suppresses throw
   * @param _address The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return success true if the STATICCALL succeeded, false otherwise
   * @return result true if the STATICCALL succeeded and the contract at _address
   * indicates support of the interface with identifier _interfaceId, false otherwise
   */
  function noThrowCall (
    address _address,
    bytes4 _interfaceId
  ) 
    internal
    view
    returns (bool success, bool result)
  {
    bytes4 erc165ID = InterfaceId_ERC165;

    // solium-disable-next-line security/no-inline-assembly
    assembly {
        let x := mload(0x40)               // Find empty storage location using "free memory pointer"
        mstore(x, erc165ID)                // Place signature at begining of empty storage
        mstore(add(x, 0x04), _interfaceId) // Place first argument directly next to signature

        success := staticcall(
                  30000,     // 30k gas
                  _address, // To addr
                  x,         // Inputs are stored at location x
                  0x20,      // Inputs are 32 bytes long
                  x,         // Store output over input (saves space)
                  0x20)      // Outputs are 32 bytes long

        result := mload(x)   // Load the result
    }
  }
}