// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {ERC1271TypedSigner} from "../utils/cryptography/ERC1271TypedSigner.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

contract ERC1271TypedSignerECDSA is ERC1271TypedSigner {
    address private immutable _signer;

    constructor(address signerAddr) EIP712("ERC1271TypedSignerECDSA", "1") {
        _signer = signerAddr;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return _signer == recovered && err == ECDSA.RecoverError.NoError;
    }
}
