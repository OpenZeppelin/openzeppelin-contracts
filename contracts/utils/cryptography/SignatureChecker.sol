// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

import "./ECDSA.sol";
import "../Address.sol";
import "../../interfaces/IERC1271.sol";

library SignatureChecker {
    function isValidSignature(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
        if (Address.isContract(signer)) {
            try IERC1271(signer).isValidSignature(hash, signature) returns (bytes4 magicValue) {
                return magicValue == IERC1271(signer).isValidSignature.selector;
            } catch {
                return false;
            }
        } else {
            return ECDSA.recover(hash, signature) == signer;
        }
    }
}
