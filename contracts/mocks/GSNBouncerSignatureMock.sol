pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "../GSN/GSNRecipient.sol";
import "../GSN/bouncers/GSNBouncerSignature.sol";

contract GSNBouncerSignatureMock is GSNRecipient, GSNBouncerSignature {
    constructor(address trustedSigner) public {
        GSNRecipient.initialize();
        GSNBouncerSignature.initialize(trustedSigner);
    }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
