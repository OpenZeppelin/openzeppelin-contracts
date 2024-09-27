// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ECDSATest is Test {
    function testRecoverWithValidSignature(string calldata seed, string calldata message) public {
        (address signer, uint256 key) = makeAddrAndKey(seed);

        bytes32 hash = keccak256(abi.encode(message));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, hash);

        bytes memory signature = abi.encodePacked(r, s, v);
        assertEq(signer, ECDSA.recover(hash, signature));
    }

    function testRecoverWithWrongMessage(string calldata seed, string calldata message, bytes32 digest) public {
        (address signer, uint256 key) = makeAddrAndKey(seed);

        bytes32 validDigest = keccak256(abi.encode(message));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, validDigest);

        bytes memory signature = abi.encodePacked(r, s, v);
        assertTrue(signer != ECDSA.recover(digest, signature));
    }
}
