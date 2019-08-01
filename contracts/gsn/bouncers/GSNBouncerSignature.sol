pragma solidity ^0.5.0;

import "../IRelayRecipient.sol";
import "./GSNBouncerUtils.sol";
import "../../cryptography/ECDSA.sol";

contract GSNBouncerSignature is IRelayRecipient, GSNBouncerUtils {
    using ECDSA for bytes32;

    address private _trustedSigner;

    enum GSNRecipientSignedDataErrorCodes {
        INVALID_SIGNER
    }

    constructor(address trustedSigner) public {
        _trustedSigner = trustedSigner;
    }

    function acceptRelayedCall(
        address relay,
        address from,
        bytes calldata encodedFunction,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        bytes calldata approvalData,
        uint256
    )
        external
        view
        returns (uint256, bytes memory)
    {
        bytes memory blob = abi.encodePacked(
            relay,
            from,
            encodedFunction,
            transactionFee,
            gasPrice,
            gasLimit,
            nonce, // Prevents replays on RelayHub
            getHubAddr(), // Prevents replays in multiple RelayHubs
            address(this) // Prevents replays in multiple recipients
        );
        if (keccak256(blob).toEthSignedMessageHash().recover(approvalData) == _trustedSigner) {
            return (_acceptRelayedCall(), "");
        } else {
            return (_declineRelayedCall(uint256(GSNRecipientSignedDataErrorCodes.INVALID_SIGNER)), "");
        }
    }

    function preRelayedCall(bytes calldata) external returns (bytes32) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function postRelayedCall(bytes calldata, bool, uint256, bytes32) external {
        // solhint-disable-previous-line no-empty-blocks
    }
}
