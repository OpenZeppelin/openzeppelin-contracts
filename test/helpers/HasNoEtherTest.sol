pragma solidity ^0.4.8;

import "../../contracts/ownership/HasNoEther.sol";

contract HasNoEtherTest is HasNoEther {

  // Constructor with explicit payable — should still fail
  function HasNoEtherTest() payable {

  }

  // Default function with explicit payable — should still fail
  function() external payable {
    throw;
  }

}
