pragma solidity ^0.5.0;

import "./IRelayRecipient.sol";
import "./GSNContext.sol";

/*
 * @dev Base GSN recipient contract, adding the recipient interface and enabling
 * GSN support. Derived contracts must implement all interface methods.
 */
contract GSNRecipient is IRelayRecipient, GSNContext {
    uint256 constant private RELAYED_CALL_ACCEPTED = 0;
    uint256 constant private RELAYED_CALL_REJECTED = 11;

    function _acceptRelayedCall() internal pure returns (uint256) {
        return RELAYED_CALL_ACCEPTED;
    }

    function _declineRelayedCall(uint256 errorCode) internal pure returns (uint256) {
        return RELAYED_CALL_REJECTED + errorCode;
    }
}
