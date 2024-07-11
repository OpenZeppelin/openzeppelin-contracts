// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {Clones} from "../../proxy/Clones.sol";
import {P256} from "../../utils/cryptography/P256.sol";

contract IdentityP256Implementation is IERC1271 {
    function publicKey() public view returns (bytes memory) {
        return Clones.fetchCloneArgs(address(this));
    }

    function isValidSignature(bytes32 h, bytes memory signature) external view returns (bytes4 magicValue) {
        // fetch and decode immutable public key for the clone
        (bytes32 qx, bytes32 qy) = abi.decode(publicKey(), (bytes32, bytes32));

        bytes32 r;
        bytes32 s;
        assembly ("memory-safe") {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
        }

        return P256.verify(h, r, s, qx, qy) ? IERC1271.isValidSignature.selector : bytes4(0);
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
