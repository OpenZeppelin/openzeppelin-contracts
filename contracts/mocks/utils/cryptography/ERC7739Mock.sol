// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {ERC7739} from "../../../utils/cryptography/ERC7739.sol";
import {AbstractSigner} from "../../../utils/cryptography/AbstractSigner.sol";

contract ERC7739ECDSAMock is AbstractSigner, ERC7739 {
    address private _signer;

    constructor(address signerAddr) EIP712("ERC7739ECDSA", "1") {
        _signer = signerAddr;
    }

    function signer() public view virtual returns (address) {
        return _signer;
    }

    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}
