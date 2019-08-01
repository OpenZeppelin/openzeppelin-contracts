pragma solidity ^0.5.0;

import "../gsn/GSNRecipientSignedData.sol";

contract GSNRecipientSignedDataMock is GSNRecipientSignedData {
    constructor(address trustedSigner) public GSNRecipientSignedData(trustedSigner) {
        // solhint-disable-previous-line no-empty-blocks
    }

    event MockFunctionCalled();

    function mockFunction() public {
        emit MockFunctionCalled();
    }
}
