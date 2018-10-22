pragma solidity ^0.4.24;

import "../utils/Address.sol";

contract AddressImpl {
  function isInitializedContract(address account)
    external
    view
    returns (bool)
  {
    return Address.isInitializedContract(account); 
  }
  
}
