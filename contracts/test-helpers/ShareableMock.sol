pragma solidity ^0.4.4;
import "../Shareable.sol";

contract ShareableMock is Shareable {

  uint public count = 0;

  function ShareableMock(address[] _owners, uint _required) Shareable(_owners, _required) {

  }

  function increaseCount(bytes32 action) onlymanyowners(action) {
    count = count + 1;
  }

  function isOwnerConst(address _addr) constant returns (bool) {
    return isOwner(_addr);
  }
}
