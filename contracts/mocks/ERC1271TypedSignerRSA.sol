// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {RSA} from "../utils/cryptography/RSA.sol";
import {ERC1271TypedSigner} from "../utils/cryptography/ERC1271TypedSigner.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

contract ERC1271TypedSignerRSA is ERC1271TypedSigner {
    bytes private _e;
    bytes private _n;

    constructor(bytes memory e, bytes memory n) EIP712("ERC1271TypedSignerRSA", "1") {
        _e = e;
        _n = n;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        return RSA.pkcs1(hash, signature, _e, _n);
    }
}
