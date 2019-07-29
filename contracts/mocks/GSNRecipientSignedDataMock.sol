pragma solidity ^0.5.0;

import "../drafts/meta-tx/GSNRecipientSignedData.sol";

contract GSNRecipientSignedDataMock is GSNRecipientSignedData {
    constructor(address trustedSigner, address relayHub)
    public
    GSNRecipientSignedData(trustedSigner)
    GSNContext(relayHub) { }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
