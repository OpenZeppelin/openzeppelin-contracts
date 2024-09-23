// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {RSA} from "../../utils/cryptography/RSA.sol";
import {EIP712ReadableSigner} from "./EIP712ReadableSigner.sol";

abstract contract SignerRSA is EIP712ReadableSigner {
    bytes private _e;
    bytes private _n;

    function signer() public view virtual returns (bytes memory e, bytes memory n) {
        return (_e, _n);
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1(hash, signature, e, n);
    }
}
