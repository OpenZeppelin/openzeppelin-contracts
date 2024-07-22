// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {Clones} from "../../proxy/Clones.sol";
import {RSA} from "../../utils/cryptography/RSA.sol";

contract IdentityRSAImplementation is IERC1271 {
    function publicKey() public view returns (bytes memory e, bytes memory n) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes, bytes));
    }

    function isValidSignature(bytes32 h, bytes calldata signature) external view returns (bytes4 magicValue) {
        // fetch immutable public key for the clone
        (bytes memory e, bytes memory n) = publicKey();

        // here we don't use pkcs1 directly, because `h` is likely not the result of a sha256 hash, but rather of a
        // keccak256 one. This means RSA signers should compute the "ethereum" keccak256 hash of the data, and re-hash
        // it using sha256
        return RSA.pkcs1Sha256(abi.encode(h), signature, e, n) ? IERC1271.isValidSignature.selector : bytes4(0);
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
