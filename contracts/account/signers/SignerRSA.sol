// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {RSA} from "../../utils/cryptography/RSA.sol";
import {Clones} from "../../proxy/Clones.sol";
import {EIP712Signer} from "./EIP712Signer.sol";

abstract contract SignerRSA is EIP712Signer {
    function signer() public view virtual returns (bytes memory e, bytes memory n) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes, bytes));
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1(hash, signature, e, n);
    }
}
