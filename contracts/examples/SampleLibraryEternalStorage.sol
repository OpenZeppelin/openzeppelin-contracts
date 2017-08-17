pragma solidity ^0.4.13;

import '../math/SafeMath.sol';
import "../data/EternalStorage.sol";

library CounterLibrary {
  using SafeMath for uint256;

  function getCount(address _storageContract) public constant returns(uint256) {
    return EternalStorage(_storageContract).UIntValues(sha3("counter"));
  } 
	
  function increment(address _storageContract) public returns (uint) {
    uint count = getCount(_storageContract);
    uint value = count.add(1);
    EternalStorage(_storageContract).setUIntValue(sha3("counter"), value);
    return value;
  }
}