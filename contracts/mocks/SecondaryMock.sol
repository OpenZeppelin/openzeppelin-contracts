pragma solidity ^0.5.2;

import "../ownership/Secondary.sol";

contract SecondaryMock is Secondary {
    constructor() public {
        Secondary.initialize(_msgSender());
    }

    function onlyPrimaryMock() public view onlyPrimary {
        // solhint-disable-previous-line no-empty-blocks
    }
}
