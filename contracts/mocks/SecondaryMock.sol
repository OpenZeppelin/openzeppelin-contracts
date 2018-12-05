pragma solidity ^0.4.24;

import "../ownership/Secondary.sol";

contract SecondaryMock is Secondary {
    function onlyPrimaryMock() public view onlyPrimary {}
}
