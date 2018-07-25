pragma solidity ^0.4.24;


/**
 * @title ERC165Checker
 * @dev Use `using ERC165Checker for address;` to include this library
 */
library ERC165Checker {

  bytes4 private constant InterfaceId_Invalid = 0xffffffff;
  bytes4 private constant InterfaceId_ERC165 = 0x01ffc9a7;

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @dev Interface identification is specified in ERC-165.
   */
  function supportsInterface(address _address, bytes4 _interfaceId)
    internal
    view
    returns (bool)
  {
    uint256 success;
    uint256 result;

    // supports ERC165 (probably)?
    (success, result) = noThrowCall(_address, InterfaceId_ERC165);
    if ((success == 0) || (result == 0)) {
      return false;
    }

    // definitely supports ERC165?
    (success, result) = noThrowCall(_address, InterfaceId_Invalid);
    if ((success == 0) || (result != 0)) {
      return false;
    }

    // supports the _interfaceId we care about?
    (success, result) = noThrowCall(_address, _interfaceId);
    if ((success == 1) && (result == 1)) {
      return true;
    }

    return false;
  }

  /**
   * @dev noThrowCall via https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
   */
  function noThrowCall(
    address _address,
    bytes4 _interfaceId
  )
    internal
    view
    returns (uint256 success, uint256 result)
  {
    bytes4 erc165ID = InterfaceId_ERC165;

    // solium-disable-next-line security/no-inline-assembly
    assembly {
      let x := mload(0x40)                // Find empty storage location using "free memory pointer"
      mstore(x, erc165ID)                 // Place signature at begining of empty storage to call supportsInterface()
      mstore(add(x, 0x04), _interfaceId)  // Place first argument directly next to signature

      success := staticcall(
        30000,         // 30k gas
        _address,      // To addr
        x,             // Inputs are stored at location x
        0x20,          // Inputs are 32 bytes long
        x,             // Store output over input (saves space)
        0x20           // Outputs are 32 bytes long
      )
      result := mload(x)  // Load the result
    }
  }
}
