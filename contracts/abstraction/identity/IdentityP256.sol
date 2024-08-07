// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";
import {Clones} from "../../proxy/Clones.sol";
import {P256} from "../../utils/cryptography/P256.sol";

contract IdentityP256Implementation is IERC1271, IERC7579Validator {
    function publicKey() public view returns (bytes memory) {
        return Clones.fetchCloneArgs(address(this));
    }

    function onInstall(bytes calldata) public virtual override {}

    function onUninstall(bytes calldata) public virtual override {}

    function isModuleType(uint256 moduleTypeId) public view virtual override returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }

    function isValidSignature(
        bytes32 h,
        bytes calldata signature
    ) public view virtual override returns (bytes4 magicValue) {
        return _verify(h, signature) ? IERC1271.isValidSignature.selector : bytes4(0);
    }

    function isValidSignatureWithSender(
        address,
        bytes32 h,
        bytes calldata signature
    ) public view virtual override returns (bytes4) {
        return _verify(h, signature) ? IERC1271.isValidSignature.selector : bytes4(0);
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public virtual override returns (uint256) {
        return
            _verify(userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    function _verify(bytes32 h, bytes calldata signature) private view returns (bool result) {
        if (signature.length < 0x40) {
            return false;
        } else {
            // parse signature
            bytes32 r = bytes32(signature[0x00:0x20]);
            bytes32 s = bytes32(signature[0x20:0x40]);

            // fetch and decode immutable public key for the clone
            (bytes32 qx, bytes32 qy) = abi.decode(publicKey(), (bytes32, bytes32));
            return P256.verify(h, r, s, qx, qy);
        }
    }
}

contract IdentityP256Factory {
    address public immutable implementation = address(new IdentityP256Implementation());

    function create(bytes memory publicKey) public returns (address instance) {
        // predict the address of the instance for that key
        address predicted = predict(publicKey);
        // if instance does not exist ...
        if (predicted.code.length == 0) {
            // ... deploy it
            Clones.cloneWithImmutableArgsDeterministic(implementation, publicKey, bytes32(0));
        }
        return predicted;
    }

    function predict(bytes memory publicKey) public view returns (address instance) {
        return Clones.predictWithImmutableArgsDeterministicAddress(implementation, publicKey, bytes32(0));
    }
}
