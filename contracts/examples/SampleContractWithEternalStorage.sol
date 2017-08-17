pragma solidity ^0.4.13;

import "../lifecycle/Pausable.sol";
import "../examples/SampleLibraryEternalStorage.sol";

contract SampleContractWithEternalStorage is Pausable {

  using CounterLibrary for address;
  address eternalStorage;

  function SampleContractWithEternalStorage(address _eternalStorage) {
    eternalStorage = _eternalStorage;
  }


  function incrementValue() public returns (uint) {
    return eternalStorage.increment();
  }

  function getValue() public returns (uint) {
    return eternalStorage.getCount();
  }

}
  // function transferEternalStorageOwnership(address recipient) public onlyOwner {
  //   Ownable(eternalStorage).transferOwnership(recipient);
  // }
