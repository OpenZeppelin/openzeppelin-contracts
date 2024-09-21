// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {P256} from "../../utils/cryptography/P256.sol";
import {Clones} from "../../proxy/Clones.sol";
import {EIP712Signer} from "./EIP712Signer.sol";

abstract contract SignerP256 is EIP712Signer {
    function signer() public view virtual returns (bytes32 qx, bytes32 qy) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes32, bytes32));
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        if (signature.length < 0x40) return false;

        // parse signature
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);

        // fetch and decode immutable public key for the clone
        (bytes32 qx, bytes32 qy) = signer();
        return P256.verify(hash, r, s, qx, qy);
    }
}
