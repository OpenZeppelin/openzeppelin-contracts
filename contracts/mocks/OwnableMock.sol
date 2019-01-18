pragma solidity ^0.5.0;

import "../ownership/Ownable.sol";

contract OwnableMock is Ownable {
    constructor() {
        Ownable.initialize(msg.sender);
    }
}
