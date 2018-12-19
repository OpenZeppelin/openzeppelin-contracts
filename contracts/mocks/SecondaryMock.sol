pragma solidity ^0.5.1;

import "../ownership/Secondary.sol";

contract SecondaryMock is Secondary {
    function onlyPrimaryMock() public view onlyPrimary {}
}
