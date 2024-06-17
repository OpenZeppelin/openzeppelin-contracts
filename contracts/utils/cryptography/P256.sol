// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";

/**
 * @dev Implementation of secp256r1 verification and recovery functions.
 *
 * The secp256r1 curve (also known as P256) is a NIST standard curve with wide support in modern devices
 * and cryptographic standards. Some notable examples include Apple's Secure Enclave and Android's Keystore
 * as well as authentication protocols like FIDO2.
 *
 * Based on the original https://github.com/itsobvioustech/aa-passkeys-wallet/blob/main/src/Secp256r1.sol[implementation of itsobvioustech].
 * Heavily inspired in https://github.com/maxrobot/elliptic-solidity/blob/master/contracts/Secp256r1.sol[maxrobot] and
 * https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol[tdrerup] implementations.
 */
library P256 {
    struct JPoint {
        uint256 x;
        uint256 y;
        uint256 z;
    }

    /// @dev Generator (x component)
    uint256 internal constant GX = 0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296;
    /// @dev Generator (y component)
    uint256 internal constant GY = 0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5;
    /// @dev P (size of the field)
    uint256 internal constant P = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF;
    /// @dev N (order of G)
    uint256 internal constant N = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
    /// @dev A parameter of the weierstrass equation
    uint256 internal constant A = 0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC;
    /// @dev B parameter of the weierstrass equation
    uint256 internal constant B = 0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B;

    /// @dev (P + 1) / 4. Usefull to compute sqrt
    uint256 private constant P1DIV4 = 0x3fffffffc0000000400000000000000000000000400000000000000000000000;

    /**
     * @dev Verifies a secp256r1 signature using the RIP-7212 precompile at `address(0x100)` and falls back to the
     * Solidity implementation if the precompile is not available.
     *
     * @param h - hashed message
     * @param r - signature half R
     * @param s - signature half S
     * @param qx - public key coordinate X
     * @param qy - public key coordinate Y
     */
    function verify(uint256 h, uint256 r, uint256 s, uint256 qx, uint256 qy) internal view returns (bool) {
        (bool success, bytes memory returndata) = address(0x100).staticcall(abi.encode(h, r, s, qx, qy));
        return success && returndata.length == 0x20 ? abi.decode(returndata, (bool)) : verifySolidity(h, r, s, qx, qy);
    }

    /**
     * @dev signature verification - solidity implementation
     * @param h - hashed message
     * @param r - signature half R
     * @param s - signature half S
     * @param qx - public key coordinate X
     * @param qy - public key coordinate Y
     */
    function verifySolidity(uint256 h, uint256 r, uint256 s, uint256 qx, uint256 qy) internal view returns (bool) {
        if (r == 0 || r >= N || s == 0 || s >= N || !isOnCurve(qx, qy)) return false;

        JPoint[16] memory points = _preComputeJacobianPoints(qx, qy);
        uint256 w = Math.invModPrime(s, N);
        uint256 u1 = mulmod(h, w, N);
        uint256 u2 = mulmod(r, w, N);
        (uint256 x, ) = _jMultShamir(points, u1, u2);
        return (x == r);
    }

    /**
     * @dev public key recovery
     * @param h - hashed message
     * @param v - signature recovery param
     * @param r - signature half R
     * @param s - signature half S
     */
    function recovery(uint256 h, uint8 v, uint256 r, uint256 s) internal view returns (uint256, uint256) {
        if (r == 0 || r >= N || s == 0 || s >= N || v > 1) return (0, 0);

        uint256 rx = r;
        uint256 ry2 = addmod(mulmod(addmod(mulmod(rx, rx, P), A, P), rx, P), B, P); // weierstrass equation y² = x³ + a.x + b
        uint256 ry = Math.modExp(ry2, P1DIV4, P); // This formula for sqrt work because P ≡ 3 (mod 4)
        if (mulmod(ry, ry, P) != ry2) return (0, 0); // Sanity check
        if (ry % 2 != v % 2) ry = P - ry;

        JPoint[16] memory points = _preComputeJacobianPoints(rx, ry);
        uint256 w = Math.invModPrime(r, N);
        uint256 u1 = mulmod(N - (h % N), w, N);
        uint256 u2 = mulmod(s, w, N);
        (uint256 x, uint256 y) = _jMultShamir(points, u1, u2);
        return (x, y);
    }

    /**
     * @dev address recovery
     * @param h - hashed message
     * @param v - signature recovery param
     * @param r - signature half R
     * @param s - signature half S
     */
    function recoveryAddress(uint256 h, uint8 v, uint256 r, uint256 s) internal view returns (address) {
        (uint256 qx, uint256 qy) = recovery(h, v, r, s);
        return getAddress(qx, qy);
    }

    /**
     * @dev derivate public key
     * @param privateKey - private key
     */
    function getPublicKey(uint256 privateKey) internal view returns (uint256, uint256) {
        (uint256 x, uint256 y, uint256 z) = _jMult(GX, GY, 1, privateKey);
        return _affineFromJacobian(x, y, z);
    }

    /**
     * @dev Hash public key into an address
     * @param qx - public key coordinate X
     * @param qy - public key coordinate Y
     */
    function getAddress(uint256 qx, uint256 qy) internal pure returns (address result) {
        assembly ("memory-safe") {
            mstore(0x00, qx)
            mstore(0x20, qy)
            result := keccak256(0x00, 0x40)
        }
    }

    /**
     * @dev check if a point is on the curve.
     */
    function isOnCurve(uint256 x, uint256 y) internal pure returns (bool result) {
        assembly ("memory-safe") {
            let p := P
            let lhs := mulmod(y, y, p) // y^2
            let rhs := addmod(mulmod(addmod(mulmod(x, x, p), A, p), x, p), B, p) // ((x^2 + a) * x) + b = x^3 + ax + b
            result := eq(lhs, rhs) // Should conform with the Weierstrass equation
        }
    }

    /**
     * @dev Reduce from jacobian to affine coordinates
     * @param jx - jacobian coordinate x
     * @param jy - jacobian coordinate y
     * @param jz - jacobian coordinate z
     * @return ax - affine coordinate x
     * @return ay - affine coordinate y
     */
    function _affineFromJacobian(uint256 jx, uint256 jy, uint256 jz) private view returns (uint256 ax, uint256 ay) {
        if (jz == 0) return (0, 0);
        uint256 zinv = Math.invModPrime(jz, P);
        uint256 zzinv = mulmod(zinv, zinv, P);
        uint256 zzzinv = mulmod(zzinv, zinv, P);
        ax = mulmod(jx, zzinv, P);
        ay = mulmod(jy, zzzinv, P);
    }

    /**
     * @dev Point addition on the jacobian coordinates
     * Reference: https://www.hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#addition-add-1998-cmo-2
     */
    function _jAdd(
        uint256 x1,
        uint256 y1,
        uint256 z1,
        uint256 x2,
        uint256 y2,
        uint256 z2
    ) private pure returns (uint256 rx, uint256 ry, uint256 rz) {
        assembly ("memory-safe") {
            let p := P
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

    /**
     * @dev Point doubling on the jacobian coordinates
     * Reference: https://www.hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#doubling-dbl-1998-cmo-2
     */
    function _jDouble(uint256 x, uint256 y, uint256 z) private pure returns (uint256 rx, uint256 ry, uint256 rz) {
        assembly ("memory-safe") {
            let p := P
            let yy := mulmod(y, y, p)
            let zz := mulmod(z, z, p)
            let s := mulmod(4, mulmod(x, yy, p), p) // s = 4*x*y²
            let m := addmod(mulmod(3, mulmod(x, x, p), p), mulmod(A, mulmod(zz, zz, p), p), p) // m = 3*x²+a*z⁴
            let t := addmod(mulmod(m, m, p), sub(p, mulmod(2, s, p)), p) // t = m²-2*s

            // x' = t
            rx := t
            // y' = m*(s-t)-8*y⁴
            ry := addmod(mulmod(m, addmod(s, sub(p, t), p), p), sub(p, mulmod(8, mulmod(yy, yy, p), p)), p)
            // z' = 2*y*z
            rz := mulmod(2, mulmod(y, z, p), p)
        }
    }

    /**
     * @dev Point multiplication on the jacobian coordinates
     */
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

    /**
     * @dev Compute P·u1 + Q·u2 using the precomputed points for P and Q (see {_preComputeJacobianPoints}).
     *
     * Uses Strauss Shamir trick for EC multiplication
     * https://stackoverflow.com/questions/50993471/ec-scalar-multiplication-with-strauss-shamir-method
     * we optimise on this a bit to do with 2 bits at a time rather than a single bit
     * the individual points for a single pass are precomputed
     * overall this reduces the number of additions while keeping the same number of doublings
     */
    function _jMultShamir(JPoint[16] memory points, uint256 u1, uint256 u2) private view returns (uint256, uint256) {
        uint256 x = 0;
        uint256 y = 0;
        uint256 z = 0;
        unchecked {
            for (uint256 i = 0; i < 128; ++i) {
                if (z > 0) {
                    (x, y, z) = _jDouble(x, y, z);
                    (x, y, z) = _jDouble(x, y, z);
                }
                // Read 2 bits of u1, and 2 bits of u2. Combining the two give a lookup index in the table.
                uint256 pos = ((u1 >> 252) & 0xc) | ((u2 >> 254) & 0x3);
                if (pos > 0) {
                    if (z == 0) {
                        (x, y, z) = (points[pos].x, points[pos].y, points[pos].z);
                    } else {
                        (x, y, z) = _jAdd(x, y, z, points[pos].x, points[pos].y, points[pos].z);
                    }
                }
                u1 <<= 2;
                u2 <<= 2;
            }
        }
        return _affineFromJacobian(x, y, z);
    }

    /**
     * @dev Precompute a matrice of useful jacobian points associated with a given P. This can be seen as a 4x4 matrix
     * that contains combination of P and G (generator) up to 3 times each. See the table below:
     *
     * ┌────┬─────────────────────┐
     * │  i │  0    1     2     3 │
     * ├────┼─────────────────────┤
     * │  0 │  0    p    2p    3p │
     * │  4 │  g  g+p  g+2p  g+3p │
     * │  8 │ 2g 2g+p 2g+2p 2g+3p │
     * │ 12 │ 3g 3g+p 3g+2p 3g+3p │
     * └────┴─────────────────────┘
     */
    function _preComputeJacobianPoints(uint256 px, uint256 py) private pure returns (JPoint[16] memory points) {
        points[0x00] = JPoint(0, 0, 0);
        points[0x01] = JPoint(px, py, 1);
        points[0x04] = JPoint(GX, GY, 1);
        points[0x02] = _jDoublePoint(points[0x01]);
        points[0x08] = _jDoublePoint(points[0x04]);
        points[0x03] = _jAddPoint(points[0x01], points[0x02]);
        points[0x05] = _jAddPoint(points[0x01], points[0x04]);
        points[0x06] = _jAddPoint(points[0x02], points[0x04]);
        points[0x07] = _jAddPoint(points[0x03], points[0x04]);
        points[0x09] = _jAddPoint(points[0x01], points[0x08]);
        points[0x0a] = _jAddPoint(points[0x02], points[0x08]);
        points[0x0b] = _jAddPoint(points[0x03], points[0x08]);
        points[0x0c] = _jAddPoint(points[0x04], points[0x08]);
        points[0x0d] = _jAddPoint(points[0x01], points[0x0c]);
        points[0x0e] = _jAddPoint(points[0x02], points[0x0c]);
        points[0x0f] = _jAddPoint(points[0x03], points[0x0C]);
    }

    function _jAddPoint(JPoint memory p1, JPoint memory p2) private pure returns (JPoint memory) {
        (uint256 x, uint256 y, uint256 z) = _jAdd(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        return JPoint(x, y, z);
    }

    function _jDoublePoint(JPoint memory p) private pure returns (JPoint memory) {
        (uint256 x, uint256 y, uint256 z) = _jDouble(p.x, p.y, p.z);
        return JPoint(x, y, z);
    }
}
