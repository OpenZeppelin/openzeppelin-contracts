pragma solidity ^0.4.18;

library AddressUtils {

  function isContract(address addr) internal view returns (bool) {
    uint size;
    assembly { size := extcodesize(addr) }
    return size > 0;
  }

}