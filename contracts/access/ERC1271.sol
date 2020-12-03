// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.6.0 <0.8.0;

import {ECDSA} from "../cryptography/ECDSA.sol";
import {Ownable} from "./Ownable.sol";

interface IERC1271 {
    function isValidSignature(bytes32 _messageHash, bytes memory _signature)
        external
        view
        returns (bytes4 magicValue);
}

/// @title ERC1271
/// @notice Ownable wrapper for ERC1271 compatibility
contract ERC1271 is IERC1271, Ownable {
    using ECDSA for bytes32;

    // Valid magic value bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 private constant _VALID_SIG = 0x1626ba7e;
    // Invalid magic value
    bytes4 private constant _INVALID_SIG = 0xffffffff;

    function isValidSignature(bytes32 messageHash, bytes memory signature)
        public
        view
        override
        returns (bytes4)
    {
        require(signature.length == 65, "ERC1271: Invalid signature length");
        address signer = messageHash.recover(signature);
        return signer == Ownable.owner() ? _VALID_SIG : _INVALID_SIG;
    }
}
