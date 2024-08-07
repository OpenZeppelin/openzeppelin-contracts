// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";
import {Clones} from "../../proxy/Clones.sol";
import {RSA} from "../../utils/cryptography/RSA.sol";

contract IdentityRSAImplementation is IERC1271, IERC7579Validator {
    function publicKey() public view returns (bytes memory e, bytes memory n) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes, bytes));
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

    function _verify(bytes32 h, bytes calldata signature) private view returns (bool) {
        // fetch immutable public key for the clone
        (bytes memory e, bytes memory n) = publicKey();

        // here we don't use pkcs1 directly, because `h` is likely not the result of a sha256 hash, but rather of a
        // keccak256 one. This means RSA signers should compute the "ethereum" keccak256 hash of the data, and re-hash
        // it using sha256
        return RSA.pkcs1Sha256(abi.encode(h), signature, e, n);
    }
}

contract IdentityRSAFactory {
    address public immutable implementation = address(new IdentityRSAImplementation());

    function create(bytes calldata e, bytes calldata n) public returns (address instance) {
        // predict the address of the instance for that key
        address predicted = predict(e, n);
        // if instance does not exist ...
        if (predicted.code.length == 0) {
            // ... deploy it
            Clones.cloneWithImmutableArgsDeterministic(implementation, abi.encode(e, n), bytes32(0));
        }
        return predicted;
    }

    function predict(bytes calldata e, bytes calldata n) public view returns (address instance) {
        return Clones.predictWithImmutableArgsDeterministicAddress(implementation, abi.encode(e, n), bytes32(0));
    }
}
