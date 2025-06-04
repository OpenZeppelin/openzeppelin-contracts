// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7913SignatureVerifier} from "../../../../contracts/interfaces/IERC7913.sol";

contract ERC7913VerifierMock is IERC7913SignatureVerifier {
    function verify(bytes calldata key, bytes32 /* hash */, bytes calldata signature) external pure returns (bytes4) {
        // For testing purposes, we'll only accept specific key/signature combinations
        return
            (_isKnownSigner1(key, signature) || _isKnownSigner2(key, signature))
                ? IERC7913SignatureVerifier.verify.selector
                : bytes4(0xffffffff);
    }

    function _isKnownSigner1(bytes calldata key, bytes calldata signature) internal pure returns (bool) {
        return keccak256(key) == keccak256("valid_key_1") && keccak256(signature) == keccak256("valid_signature_1");
    }

    function _isKnownSigner2(bytes calldata key, bytes calldata signature) internal pure returns (bool) {
        return keccak256(key) == keccak256("valid_key_2") && keccak256(signature) == keccak256("valid_signature_2");
    }
}
