pragma solidity ^0.5.0;

import "../ownership/Ownable.sol";

contract OwnableMock is Ownable {
    constructor() public {
        Ownable.initialize(msg.sender);
    }
}
