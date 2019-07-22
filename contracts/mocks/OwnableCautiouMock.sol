pragma solidity ^0.5.0;

import "../ownership/OwnableCautious.sol";

contract OwnableCautiousMock is OwnableCautious {
    function onlyOwnerMock() public view onlyOwner {
        // solhint-disable-previous-line no-empty-blocks
    }
}