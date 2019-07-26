pragma solidity ^0.5.0;

import "../drafts/meta-tx/SigningRecipient.sol";

contract SigningRecipientMock is SigningRecipient {
    constructor(address trustedSigner, address relayHub) public SigningRecipient(trustedSigner) GSNContext(relayHub) {
    }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
