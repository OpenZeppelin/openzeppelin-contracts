// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {RSA} from "../../utils/cryptography/RSA.sol";
import {Clones} from "../../proxy/Clones.sol";
import {AccountSigner} from "./AccountSigner.sol";

abstract contract AccountSignerRSA is AccountSigner {
    // NOTE: There is no way to store immutable byte arrays in a contract, so we use a function to return
    // hardcoded values. This can be avoided using the AccountSignerRSAClonable contract that leverages
    // immutable arguments.
    function signer() public view virtual returns (bytes memory e, bytes memory n);

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1(hash, signature, e, n);
    }
}

abstract contract AccountSignerRSAClonable is AccountSignerRSA {
    function signer() public view override returns (bytes memory e, bytes memory m) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes, bytes));
    }
}
