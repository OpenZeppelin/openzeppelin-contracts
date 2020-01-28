pragma solidity ^0.6.0;

import "../ownership/Secondary.sol";

contract SecondaryMock is Secondary {
    function onlyPrimaryMock() public view onlyPrimary { }
}
