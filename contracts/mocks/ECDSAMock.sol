// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../cryptography/ECDSA.sol";

contract ECDSAMock {
    using ECDSA for bytes32;

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}
