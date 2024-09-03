// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {RSA} from "../../utils/cryptography/RSA.sol";
import {Clones} from "../../proxy/Clones.sol";

/// @dev Identity implementation of an RSA identity that holds the public key in immutable arguments.
contract RSAIdentity is IERC1271 {
    using RSA for bytes32;

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable __self = address(this);

    struct PublicKey {
        bytes exponent;
        bytes modulus;
    }

    modifier onlyProxy() {
        require(address(this) != __self); // Must be called through delegatecall
        _;
    }

    function publicKey() public view onlyProxy returns (PublicKey memory) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (PublicKey));
    }

    function isValidSignature(bytes32 digest, bytes calldata signature) external view onlyProxy returns (bytes4) {
        return _verifyRSAIdentity(digest, signature) ? this.isValidSignature.selector : bytes4(0);
    }

    function _verifyRSAIdentity(bytes32 digest, bytes calldata signature) private view returns (bool) {
        PublicKey memory pubKey = publicKey();
        return digest.pkcs1(signature, pubKey.exponent, pubKey.modulus);
    }
}

contract RSAIdentityFactory {
    using Clones for address;

    address private immutable _RSAidentityImplementation = address(new RSAIdentity());

    function cloneDeterministicWithImmutableArgs(
        bytes memory exponent,
        bytes memory modulus,
        bytes32 salt
    ) external returns (address) {
        bytes memory pubKey = abi.encode(exponent, modulus); // Same as abi.encode(RSAIdentity.PublicKey(exponent, modulus));
        address predicted = _RSAidentityImplementation.predictDeterministicAddressWithImmutableArgs(pubKey, salt);
        if (predicted.code.length == 0) {
            _RSAidentityImplementation.cloneDeterministicWithImmutableArgs(pubKey, salt);
        }
        return predicted;
    }
}
