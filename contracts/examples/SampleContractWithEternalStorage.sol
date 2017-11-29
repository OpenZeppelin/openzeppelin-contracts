pragma solidity ^0.4.13;

import "../lifecycle/Pausable.sol";
import "../examples/SampleLibraryEternalStorage.sol";

/**
 * @title Sample contract that show how to use the EternalStorage contract
 * @author SylTi inspired from colony blog post https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88
 * @dev This contract is just an example and should not be used directly
 */
contract SampleContractWithEternalStorage is Pausable {

  using CounterLibrary for address;
  address eternalStorage;

  function SampleContractWithEternalStorage(address _eternalStorage) {
    eternalStorage = _eternalStorage;
  }

  /**
   * @dev call library function to increment the value in EternalStorage 
   */
  function incrementValue() public returns (uint) {
    return eternalStorage.increment();
  }

  /**
   * @dev call library function to get value stored in EternalStorage 
   */
  function getValue() public constant returns (uint) {
    return eternalStorage.getCount();
  }

}
