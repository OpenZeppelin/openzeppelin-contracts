// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../GSN/GSNRecipient.sol";
import "../GSN/GSNRecipientSignature.sol";

contract GSNRecipientSignatureMock is GSNRecipient, GSNRecipientSignature {
    constructor(address trustedSigner) GSNRecipientSignature(trustedSigner) { }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
