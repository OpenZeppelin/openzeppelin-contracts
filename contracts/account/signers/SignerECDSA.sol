// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {Clones} from "../../proxy/Clones.sol";
import {EIP712ReadableSigner} from "./EIP712ReadableSigner.sol";

abstract contract SignerECDSA is EIP712ReadableSigner {
    function signer() public view virtual returns (address) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (address));
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}
