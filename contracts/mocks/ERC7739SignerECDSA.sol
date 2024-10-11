// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {ERC7739Signer} from "../utils/cryptography/draft-ERC7739Signer.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

contract ERC7739SignerECDSA is ERC7739Signer {
    address private immutable _signer;

    constructor(address signerAddr) EIP712("ERC7739SignerECDSA", "1") {
        _signer = signerAddr;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return _signer == recovered && err == ECDSA.RecoverError.NoError;
    }
}
