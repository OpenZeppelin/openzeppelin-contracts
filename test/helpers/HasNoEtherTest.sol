pragma solidity ^0.4.11;

import "../../contracts/ownership/HasNoEther.sol";

contract HasNoEtherTest is HasNoEther {

  // Constructor with explicit payable — should still fail
  function HasNoEtherTest() payable {
  }

}
