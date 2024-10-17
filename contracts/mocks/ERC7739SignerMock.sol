// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC7739Signer} from "../utils/cryptography/draft-ERC7739Signer.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";

contract ERC7739SignerMock is ERC7739Signer {
    address private immutable _eoa;

    constructor(address eoa) EIP712("ERC7739SignerMock", "1") {
        _eoa = eoa;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return _eoa == recovered && err == ECDSA.RecoverError.NoError;
    }
}
