pragma solidity ^0.4.20;


/**
 * @title ERC165Query
 * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
 */
library ERC165Query {
  bytes4 constant INVALID_ID = 0xffffffff;
  bytes4 constant ERC165_ID = 0x01ffc9a7;

  /**
   * @notice Query if a contract implements an interface
   * @param _contract The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return true if the contract at _contract indicates support of the interface with
   * identifier _interfaceId, false otherwise
   * @dev Interface identification is specified in ERC-165. This function
   * uses less than 30,000 gas.
   */
  function doesContractImplementInterface (
    address _contract, 
    bytes4 _interfaceId
  ) 
    external 
    view
    returns (bool) 
  {
    uint256 success;
    uint256 result;

    (success, result) = noThrowCall(_contract, ERC165_ID);
    if ((success==0)||(result==0)) {
      return false;
    }

    (success, result) = noThrowCall(_contract, INVALID_ID);
    if ((success==0)||(result!=0)) {
      return false;
    }

    (success, result) = noThrowCall(_contract, _interfaceId);
    if ((success==1)&&(result==1)) {
      return true;
    }
    return false;
  }

  /**
   * @notice Calls the function with selector 0x01ffc9a7 (ERC165) and suppresses throw
   * @param _contract The address of the contract to query for support of an interface
   * @param _interfaceId The interface identifier, as specified in ERC-165
   * @return success true if the STATICCALL succeeded, false otherwise
   * @return result true if the STATICCALL succeeded and the contract at _contract
   * indicates support of the interface with identifier _interfaceId, false otherwise
   */
  function noThrowCall (
    address _contract,
    bytes4 _interfaceId
  ) 
    internal
    view
    returns (uint256 success, uint256 result)
  {
    bytes4 erc165ID = ERC165_ID;

    assembly {
        let x := mload(0x40)               // Find empty storage location using "free memory pointer"
        mstore(x, erc165ID)                // Place signature at begining of empty storage
        mstore(add(x, 0x04), _interfaceId) // Place first argument directly next to signature

        success := staticcall(
                  30000,     // 30k gas
                  _contract, // To addr
                  x,         // Inputs are stored at location x
                  0x20,      // Inputs are 32 bytes long
                  x,         // Store output over input (saves space)
                  0x20)      // Outputs are 32 bytes long

        result := mload(x)   // Load the result
    }
  }
}