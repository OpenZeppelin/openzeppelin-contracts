pragma solidity ^0.5.0;

import "../ownership/Secondary.sol";

contract SecondaryMock is Secondary {
    constructor() public {
        Secondary.initialize(msg.sender);
    }

    function onlyPrimaryMock() public view onlyPrimary {
        // solhint-disable-previous-line no-empty-blocks
    }
}
