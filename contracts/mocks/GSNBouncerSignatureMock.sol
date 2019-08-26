pragma solidity ^0.5.0;

import "../GSN/GSNRecipient.sol";
import "../GSN/bouncers/GSNBouncerSignature.sol";

contract GSNBouncerSignatureMock is GSNRecipient, GSNBouncerSignature {
    constructor(address trustedSigner) public GSNBouncerSignature(trustedSigner) {
        // solhint-disable-previous-line no-empty-blocks
    }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
