// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {EIP712ReadableSigner, EIP712} from "./EIP712ReadableSigner.sol";

abstract contract SignerECDSA is EIP712ReadableSigner {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address internal immutable _signer;

    constructor(address signerAddr) {
        _signer = signerAddr;
    }

    function signer() public view virtual returns (address) {
        return _signer;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}
