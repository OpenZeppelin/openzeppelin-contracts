pragma solidity ^0.5.0;

import "../IRelayRecipient.sol";

/*
 * @dev Base contract used to implement GSNBouncers.
 *
 * > This contract does not perform all required tasks to implement a GSN
 * recipient contract: end users should use `GSNRecipient` instead.
 */
contract GSNBouncerBase is IRelayRecipient {
    uint256 constant private RELAYED_CALL_ACCEPTED = 0;
    uint256 constant private RELAYED_CALL_REJECTED = 11;

    function _acceptRelayedCall(bytes memory context) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_ACCEPTED, context);
    }

    function _acceptRelayedCall() internal pure returns (uint256, bytes memory) {
        return _acceptRelayedCall("");
    }

    function _declineRelayedCall(uint256 errorCode) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_REJECTED + errorCode, "");
    }
}
