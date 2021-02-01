// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/GSN/GSNRecipient.sol";
import "../utils/GSN/GSNRecipientSignature.sol";

contract GSNRecipientSignatureMock is GSNRecipient, GSNRecipientSignature {
    constructor(address trustedSigner) GSNRecipientSignature(trustedSigner) { }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
