pragma solidity ^0.4.24;

import "../cryptography/ECDSA.sol";

contract ECDSAMock {
    using ECDSA for bytes32;

    function recover(bytes32 hash, bytes signature) public pure returns (address) {
        return hash.recover(signature);
    }

    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32) {
        return hash.toEthSignedMessageHash();
    }
}
