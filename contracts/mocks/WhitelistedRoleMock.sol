pragma solidity ^0.5.2;

import "../access/roles/WhitelistedRole.sol";

contract WhitelistedRoleMock is WhitelistedRole {
    constructor() public {
        WhitelistedRole.initialize(msg.sender);
    }

    function onlyWhitelistedMock() public view onlyWhitelisted {
        // solhint-disable-previous-line no-empty-blocks
    }
}
