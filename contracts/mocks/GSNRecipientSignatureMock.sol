pragma solidity ^0.5.0;

import "../GSN/GSNRecipient.sol";
import "../GSN/GSNRecipientSignature.sol";

contract GSNRecipientSignatureMock is GSNRecipient, GSNRecipientSignature {
    constructor(address trustedSigner) public GSNRecipientSignature(trustedSigner) {
        // solhint-disable-previous-line no-empty-blocks
    }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
