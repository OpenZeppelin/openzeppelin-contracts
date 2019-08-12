pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "../GSN/GSNRecipient.sol";
import "../GSN/bouncers/GSNBouncerSignature.sol";

contract GSNBouncerSignatureMock is GSNRecipient, GSNBouncerSignature {
    constructor(address trustedSigner) public {
        GSNBouncerSignature.initialize(trustedSigner);
        GSNRecipient.initialize();
    }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
