// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";

contract ECDSAMock {
    using ECDSA for bytes32;
    using ECDSA for bytes;

    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        return hash.recover(signature);
    }

    // solhint-disable-next-line func-name-mixedcase
    function recover_v_r_s(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (address) {
        return hash.recover(v, r, s);
    }

    // solhint-disable-next-line func-name-mixedcase
    function recover_r_vs(
        bytes32 hash,
        bytes32 r,
        bytes32 vs
    ) public pure returns (address) {
        return hash.recover(r, vs);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }

    function toEthSignedMessageHash(bytes memory s) public pure returns (bytes32) {
        return s.toEthSignedMessageHash();
    }
}
