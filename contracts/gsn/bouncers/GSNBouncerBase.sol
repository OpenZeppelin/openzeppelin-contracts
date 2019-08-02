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

    modifier onlyRelayHub() {
        require(msg.sender == getHubAddr(), "GSNBouncerBase: caller is not RelayHub");
        _;
    }

    // Base implementations for pre and post relayedCall: the onlyRelayHub modifier is added, and data forwarded to the
    // internal hook.

    /**
     * @dev See `IRelayRecipient.preRelayedCall`.
     *
     * This function should not be overriden directly, use `_preRelayedCall` instead.
     *
     * * Requirements:
     *
     * - the caller must be the `RelayHub` contract.
     */
    function preRelayedCall(bytes calldata context) external onlyRelayHub returns (bytes32) {
        return _preRelayedCall(context);
    }

    /**
     * @dev See `IRelayRecipient.postRelayedCall`.
     *
     * This function should not be overriden directly, use `_postRelayedCall` instead.
     *
     * * Requirements:
     *
     * - the caller must be the `RelayHub` contract.
     */
    function postRelayedCall(bytes calldata context, bool success, uint256 actualCharge, bytes32 preRetVal) external onlyRelayHub {
        _postRelayedCall(context, success, actualCharge, preRetVal);
    }

    /**
     * @dev Return this in acceptRelayedCall to proceed with the execution of a relayed call. Note that this contract
     * will be charged a fee by RelayHub
     */
    function _confirmRelayedCall() internal pure returns (uint256, bytes memory) {
        return _confirmRelayedCall("");
    }

    /**
     * @dev See `GSNBouncerBase._confirmRelayedCall`.
     *
     * This overload forwards `context` to _preRelayedCall and _postRelayedCall.
     */
    function _confirmRelayedCall(bytes memory context) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_ACCEPTED, context);
    }

    /**
     * @dev Return this in acceptRelayedCall to impede execution of a relayed call. No fees will be charged.
     */
    function _declineRelayedCall(uint256 errorCode) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_REJECTED + errorCode, "");
    }

    // Empty hooks for pre and post relayed call: users only have to define these if they actually use them.

    function _preRelayedCall(bytes memory) internal returns (bytes32) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function _postRelayedCall(bytes memory, bool, uint256, bytes32) internal {
        // solhint-disable-previous-line no-empty-blocks
    }
}
