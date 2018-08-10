pragma solidity ^0.4.24;

import "../lifecycle/Destructible.sol";


contract DestructibleMock is Destructible {
  function() public payable {}
}
