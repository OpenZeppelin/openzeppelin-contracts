pragma solidity ^0.4.13;

import '../math/SafeMath.sol';
import "../data/EternalStorage.sol";

/**
 * @title Sample library that show how to store/read data in the EternalStorage contract
 * @author SylTi inspired from colony blog post https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88
 * @dev This is just a example lib and should not be used directly
 */
library CounterLibrary {
  using SafeMath for uint256;

  /**
   * @dev read value from EternalStorage contract 
   * @param _storageContract address of the EternalStorage contract
   */
  function getCount(address _storageContract) public constant returns(uint256) {
    return EternalStorage(_storageContract).UIntValues(sha3("counter"));
  } 
	
  /**
   * @dev increment value in EternalStorage by one
   * @param _storageContract address of the EternalStorage contract
   */
  function increment(address _storageContract) public returns (uint) {
    uint count = getCount(_storageContract);
    uint value = count.add(1);
    EternalStorage(_storageContract).setUIntValue(sha3("counter"), value);
    return value;
  }
}
