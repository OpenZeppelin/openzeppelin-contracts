pragma solidity ^0.4.17;

import "../../contracts/ownership/HasNoEther.sol";

contract HasNoEtherTest is HasNoEther {

  // Constructor with explicit payable — should still fail
  function HasNoEtherTest() payable {
  }

}
