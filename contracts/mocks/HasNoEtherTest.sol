pragma solidity ^0.4.23;

import "../../contracts/ownership/HasNoEther.sol";


contract HasNoEtherTest is HasNoEther {

  // Constructor with explicit payable — should still fail
  constructor() public payable {
  }

}
