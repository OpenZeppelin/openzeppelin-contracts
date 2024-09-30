// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {P256} from "@openzeppelin/contracts/utils/cryptography/P256.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract P256Test is Test {
    /// forge-config: default.fuzz.runs = 512
    function testVerify(bytes32 digest, uint256 seed) public {
        uint256 privateKey = _asPrivateKey(seed);

        (bytes32 x, bytes32 y) = P256PublicKey.getPublicKey(privateKey);
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);
        s = _ensureLowerS(s);
        assertTrue(P256.verify(digest, r, s, x, y));
        assertTrue(P256.verifySolidity(digest, r, s, x, y));
    }

    /// forge-config: default.fuzz.runs = 512
    function testRecover(bytes32 digest, uint256 seed) public {
        uint256 privateKey = _asPrivateKey(seed);

        (bytes32 x, bytes32 y) = P256PublicKey.getPublicKey(privateKey);
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, digest);
        s = _ensureLowerS(s);
        (bytes32 qx0, bytes32 qy0) = P256.recovery(digest, 0, r, s);
        (bytes32 qx1, bytes32 qy1) = P256.recovery(digest, 1, r, s);
        assertTrue((qx0 == x && qy0 == y) || (qx1 == x && qy1 == y));
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

/**
 * @dev Library to derive P256 public key from private key
 * Should be removed if Foundry adds this functionality
 * See https://github.com/foundry-rs/foundry/issues/7908
 */
library P256PublicKey {
    function getPublicKey(uint256 privateKey) internal view returns (bytes32, bytes32) {
        (uint256 x, uint256 y, uint256 z) = _jMult(P256.GX, P256.GY, 1, privateKey);
        return _affineFromJacobian(x, y, z);
    }

    function _jMult(
        uint256 x,
        uint256 y,
        uint256 z,
        uint256 k
    ) private pure returns (uint256 rx, uint256 ry, uint256 rz) {
        unchecked {
            for (uint256 i = 0; i < 256; ++i) {
                if (rz > 0) {
                    (rx, ry, rz) = _jDouble(rx, ry, rz);
                }
                if (k >> 255 > 0) {
                    if (rz == 0) {
                        (rx, ry, rz) = (x, y, z);
                    } else {
                        (rx, ry, rz) = _jAdd(rx, ry, rz, x, y, z);
                    }
                }
                k <<= 1;
            }
        }
    }

    /// From P256.sol

    function _affineFromJacobian(uint256 jx, uint256 jy, uint256 jz) private view returns (bytes32 ax, bytes32 ay) {
        if (jz == 0) return (0, 0);
        uint256 zinv = Math.invModPrime(jz, P256.P);
        uint256 zzinv = mulmod(zinv, zinv, P256.P);
        uint256 zzzinv = mulmod(zzinv, zinv, P256.P);
        ax = bytes32(mulmod(jx, zzinv, P256.P));
        ay = bytes32(mulmod(jy, zzzinv, P256.P));
    }

    function _jDouble(uint256 x, uint256 y, uint256 z) private pure returns (uint256 rx, uint256 ry, uint256 rz) {
        uint256 p = P256.P;
        uint256 a = P256.A;
        assembly ("memory-safe") {
            let yy := mulmod(y, y, p)
            let zz := mulmod(z, z, p)
            let s := mulmod(4, mulmod(x, yy, p), p) // s = 4*x*y²
            let m := addmod(mulmod(3, mulmod(x, x, p), p), mulmod(a, mulmod(zz, zz, p), p), p) // m = 3*x²+a*z⁴
            let t := addmod(mulmod(m, m, p), sub(p, mulmod(2, s, p)), p) // t = m²-2*s

            // x' = t
            rx := t
            // y' = m*(s-t)-8*y⁴
            ry := addmod(mulmod(m, addmod(s, sub(p, t), p), p), sub(p, mulmod(8, mulmod(yy, yy, p), p)), p)
            // z' = 2*y*z
            rz := mulmod(2, mulmod(y, z, p), p)
        }
    }

    function _jAdd(
        uint256 x1,
        uint256 y1,
        uint256 z1,
        uint256 x2,
        uint256 y2,
        uint256 z2
    ) private pure returns (uint256 rx, uint256 ry, uint256 rz) {
        uint256 p = P256.P;
        assembly ("memory-safe") {
            let zz1 := mulmod(z1, z1, p) // zz1 = z1²
            let zz2 := mulmod(z2, z2, p) // zz2 = z2²
            let u1 := mulmod(x1, zz2, p) // u1 = x1*z2²
            let u2 := mulmod(x2, zz1, p) // u2 = x2*z1²
            let s1 := mulmod(y1, mulmod(zz2, z2, p), p) // s1 = y1*z2³
            let s2 := mulmod(y2, mulmod(zz1, z1, p), p) // s2 = y2*z1³
            let h := addmod(u2, sub(p, u1), p) // h = u2-u1
            let hh := mulmod(h, h, p) // h²
            let hhh := mulmod(h, hh, p) // h³
            let r := addmod(s2, sub(p, s1), p) // r = s2-s1

            // x' = r²-h³-2*u1*h²
            rx := addmod(addmod(mulmod(r, r, p), sub(p, hhh), p), sub(p, mulmod(2, mulmod(u1, hh, p), p)), p)
            // y' = r*(u1*h²-x')-s1*h³
            ry := addmod(mulmod(r, addmod(mulmod(u1, hh, p), sub(p, rx), p), p), sub(p, mulmod(s1, hhh, p)), p)
            // z' = h*z1*z2
            rz := mulmod(h, mulmod(z1, z2, p), p)
        }
    }
}
