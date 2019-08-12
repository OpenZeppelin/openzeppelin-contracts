pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./GSNBouncerBase.sol";
import "../../cryptography/ECDSA.sol";

contract GSNBouncerSignature is Initializable, GSNBouncerBase {
    using ECDSA for bytes32;

    // We use a random storage slot to allow proxy contracts to enable GSN support in an upgrade without changing their
    // storage layout. This value is calculated as: keccak256('gsn.bouncer.signature.trustedSigner'), minus 1.
    bytes32 constant private TRUSTED_SIGNER_STORAGE_SLOT = 0xe7b237a4017a399d277819456dce32c2356236bbc518a6d84a9a8d1cfdf1e9c5;

    enum GSNBouncerSignatureErrorCodes {
        INVALID_SIGNER
    }

    function initialize(address trustedSigner) public initializer {
        _setTrustedSigner(trustedSigner);
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
        if (keccak256(blob).toEthSignedMessageHash().recover(approvalData) == _getTrustedSigner()) {
            return _approveRelayedCall();
        } else {
            return _rejectRelayedCall(uint256(GSNBouncerSignatureErrorCodes.INVALID_SIGNER));
        }
    }

    function _getTrustedSigner() private view returns (address trustedSigner) {
      bytes32 slot = TRUSTED_SIGNER_STORAGE_SLOT;
      // solhint-disable-next-line no-inline-assembly
      assembly {
        trustedSigner := sload(slot)
      }
    }

    function _setTrustedSigner(address trustedSigner) private {
      bytes32 slot = TRUSTED_SIGNER_STORAGE_SLOT;
      // solhint-disable-next-line no-inline-assembly
      assembly {
        sstore(slot, trustedSigner)
      }
    }
}
