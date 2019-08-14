pragma solidity ^0.5.0;

import "../examples/SimpleToken.sol";

contract SimpleTokenMock is SimpleToken {
    constructor() public {
        SimpleToken.initialize(_msgSender());
    }
}
