// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {P256} from "@openzeppelin/contracts/utils/cryptography/P256.sol";
import {Errors} from "@openzeppelin/contracts/utils/Errors.sol";

contract P256Test is Test {
    /// forge-config: default.fuzz.runs = 512
    function testVerify(bytes32 digest, uint256 seed) public view {
        uint256 privateKey = _asPrivateKey(seed);

        (uint256 x, uint256 y) = vm.publicKeyP256(privateKey);
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);
        s = _ensureLowerS(s);
        assertTrue(P256.verify(digest, r, s, bytes32(x), bytes32(y)));
        assertTrue(P256.verifyNative(digest, r, s, bytes32(x), bytes32(y)));
        assertTrue(P256.verifySolidity(digest, r, s, bytes32(x), bytes32(y)));
    }

    /// forge-config: default.fuzz.runs = 512
    function testRecover(bytes32 digest, uint256 seed) public view {
        uint256 privateKey = _asPrivateKey(seed);

        (uint256 x, uint256 y) = vm.publicKeyP256(privateKey);
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);
        s = _ensureLowerS(s);
        (bytes32 qx0, bytes32 qy0) = P256.recovery(digest, 0, r, s);
        (bytes32 qx1, bytes32 qy1) = P256.recovery(digest, 1, r, s);
        assertTrue((qx0 == bytes32(x) && qy0 == bytes32(y)) || (qx1 == bytes32(x) && qy1 == bytes32(y)));
    }

    function _asPrivateKey(uint256 seed) private pure returns (uint256) {
        return bound(seed, 1, P256.N - 1);
    }

    function _ensureLowerS(bytes32 s) private pure returns (bytes32) {
        uint256 _s = uint256(s);
        unchecked {
            return _s > P256.N / 2 ? bytes32(P256.N - _s) : s;
        }
    }
}
