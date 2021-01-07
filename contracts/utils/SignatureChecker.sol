// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../cryptography/ECDSA.sol";
import "../interfaces/IERC1271.sol";
import "./Address.sol";

library SignatureChecker {
    function isValidSignature(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
        if (Address.isContract(signer)) {
            bytes4 selector = IERC1271(0).isValidSignature.selector;
            (bool success, bytes memory returndata) = signer.staticcall(abi.encodeWithSelector(selector, hash, signature));
            return success && abi.decode(returndata, (bytes4)) == selector;
        } else {
            return ECDSA.recover(hash, signature) == signer;
        }
    }
}
