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

    // How much gas is forwarded to postRelayedCall
    uint256 constant internal POST_RELAYED_CALL_MAX_GAS = 100000;

    // Base implementations for pre and post relayedCall: only RelayHub can invoke them, and data is forwarded to the
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
    function preRelayedCall(bytes calldata context) external returns (bytes32) {
        require(msg.sender == getHubAddr(), "GSNBouncerBase: caller is not RelayHub");
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
    function postRelayedCall(bytes calldata context, bool success, uint256 actualCharge, bytes32 preRetVal) external {
        require(msg.sender == getHubAddr(), "GSNBouncerBase: caller is not RelayHub");
        _postRelayedCall(context, success, actualCharge, preRetVal);
    }

    /**
     * @dev Return this in acceptRelayedCall to proceed with the execution of a relayed call. Note that this contract
     * will be charged a fee by RelayHub
     */
    function _approveRelayedCall() internal pure returns (uint256, bytes memory) {
        return _approveRelayedCall("");
    }

    /**
     * @dev See `GSNBouncerBase._approveRelayedCall`.
     *
     * This overload forwards `context` to _preRelayedCall and _postRelayedCall.
     */
    function _approveRelayedCall(bytes memory context) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_ACCEPTED, context);
    }

    /**
     * @dev Return this in acceptRelayedCall to impede execution of a relayed call. No fees will be charged.
     */
    function _rejectRelayedCall(uint256 errorCode) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_REJECTED + errorCode, "");
    }

    // Empty hooks for pre and post relayed call: users only have to define these if they actually use them.

    function _preRelayedCall(bytes memory) internal returns (bytes32) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function _postRelayedCall(bytes memory, bool, uint256, bytes32) internal {
        // solhint-disable-previous-line no-empty-blocks
    }

    /*
     * @dev Calculates how much RelaHub will charge a recipient for using `gas` at a `gasPrice`, given a relayer's
     * `serviceFee`.
     */
    function _computeCharge(uint256 gas, uint256 gasPrice, uint256 serviceFee) internal pure returns (uint256) {
        // The fee is expressed as a percentage. E.g. a value of 40 stands for a 40% fee, so the recipient will be
        // charged for 1.4 times the spent amount.
        return (gas * gasPrice * (100 + serviceFee)) / 100;
    }
}
