// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {P256} from "@openzeppelin/contracts/utils/cryptography/P256.sol";

contract P256Test is Test {
    /// forge-config: default.fuzz.runs = 256
    function testVerify(uint256 seed, bytes32 digest) public {
        uint256 privateKey = bound(uint256(keccak256(abi.encode(seed))), 1, P256.nn - 1);

        (uint256 x, uint256 y) = P256.getPublicKey(privateKey);
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);
        assertTrue(P256.verify(x, y, uint256(r), uint256(s), uint256(digest)));
    }

    /// forge-config: default.fuzz.runs = 256
    function testRecover(uint256 seed, bytes32 digest) public {
        uint256 privateKey = bound(uint256(keccak256(abi.encode(seed))), 1, P256.nn - 1);

        (uint256 x, uint256 y) = P256.getPublicKey(privateKey);
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);
        (uint256 qx0, uint256 qy0) = P256.recovery(uint256(r), uint256(s), 0, uint256(digest));
        (uint256 qx1, uint256 qy1) = P256.recovery(uint256(r), uint256(s), 1, uint256(digest));
        assertTrue((qx0 == x && qy0 == y) || (qx1 == x && qy1 == y));
    }
}