// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {P256} from "../../utils/cryptography/P256.sol";
import {Clones} from "../../proxy/Clones.sol";

/// @dev Identity implementation of an P256 identity that holds the public key in immutable arguments.
contract P256Identity is IERC1271 {
    using P256 for bytes32;

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable __self = address(this);

    modifier onlyProxy() {
        require(address(this) != __self); // Must be called through delegatecall
        _;
    }

    function publicKey() public view returns (bytes32 qx, bytes32 qy) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes32, bytes32));
    }

    function isValidSignature(bytes32 digest, bytes calldata signature) external view returns (bytes4) {
        return _verifyP256Identity(digest, signature) ? this.isValidSignature.selector : bytes4(0);
    }

    function _verifyP256Identity(bytes32 digest, bytes calldata signature) private view returns (bool) {
        if (signature.length < 0x40) return false;
        (bytes32 qx, bytes32 qy) = publicKey();
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);
        return digest.verify(r, s, qx, qy);
    }
}

contract P256IdentityFactory {
    using Clones for address;

    address private immutable _P256identityImplementation = address(new P256Identity());

    function cloneDeterministicWithImmutableArgs(bytes32 qx, bytes32 qy, bytes32 salt) external returns (address) {
        bytes memory pubKey = abi.encode(qx, qy);
        address predicted = _P256identityImplementation.predictDeterministicAddressWithImmutableArgs(pubKey, salt);
        if (predicted.code.length == 0) _P256identityImplementation.cloneDeterministicWithImmutableArgs(pubKey, salt);
        return predicted;
    }
}
