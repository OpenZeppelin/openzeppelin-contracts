// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/cryptography/verifiers/ERC7913RSAVerifier.sol)

pragma solidity ^0.8.20;

import {RSA} from "../../../utils/cryptography/RSA.sol";
import {IERC7913SignatureVerifier} from "../../../interfaces/IERC7913.sol";

/**
 * @dev ERC-7913 signature verifier that support RSA keys.
 *
 * @custom:stateless
 */
contract ERC7913RSAVerifier is IERC7913SignatureVerifier {
    /// @inheritdoc IERC7913SignatureVerifier
    function verify(bytes calldata key, bytes32 hash, bytes calldata signature) public view virtual returns (bytes4) {
        (bytes memory e, bytes memory n) = abi.decode(key, (bytes, bytes));
        return
            RSA.pkcs1Sha256(abi.encodePacked(hash), signature, e, n)
                ? IERC7913SignatureVerifier.verify.selector
                : bytes4(0xFFFFFFFF);
    }
}
