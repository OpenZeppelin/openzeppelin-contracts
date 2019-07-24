pragma solidity ^0.5.0;

import "./ContextMock.sol";
import "../drafts/meta-tx/GSNContext.sol";
import "../drafts/meta-tx/IRelayRecipient.sol";

// By inheriting from GSNContext, the internal functions are overridden automatically
contract GSNContextMock is ContextMock, GSNContext, IRelayRecipient {
    constructor(address relayHub) public GSNContext(relayHub) {
    }

    function acceptRelayedCall(
        address,
        address,
        bytes calldata,
        uint256,
        uint256,
        uint256,
        uint256,
        bytes calldata,
        uint256
    )
        external
        view
        returns (uint256, bytes memory)
    {
        return (0, "");
    }

    function preRelayedCall(bytes calldata) external returns (bytes32) {}

    function postRelayedCall(bytes calldata, bool, uint256, bytes32) external {}
}
