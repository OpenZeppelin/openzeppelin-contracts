pragma solidity ^0.5.0;

import "./ContextMock.sol";
import "../drafts/meta-tx/GSNContext.sol";

// By inheriting from GSNContext, the internal functions are overridden automatically
contract GSNContextMock is ContextMock, GSNContext {
    constructor(address relayHub) public GSNContext(relayHub) {
    }
}
