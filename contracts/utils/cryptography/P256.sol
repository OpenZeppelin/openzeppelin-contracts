// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/cryptography/P256.sol)
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {Errors} from "../Errors.sol";

/**
 * @dev Implementation of secp256r1 verification and recovery functions.
 *
 * The secp256r1 curve (also known as P256) is a NIST standard curve with wide support in modern devices
 * and cryptographic standards. Some notable examples include Apple's Secure Enclave and Android's Keystore
 * as well as authentication protocols like FIDO2.
 *
 * Based on the original https://github.com/itsobvioustech/aa-passkeys-wallet/blob/d3d423f28a4d8dfcb203c7fa0c47f42592a7378e/src/Secp256r1.sol[implementation of itsobvioustech] (GNU General Public License v3.0).
 * Heavily inspired in https://github.com/maxrobot/elliptic-solidity/blob/c4bb1b6e8ae89534d8db3a6b3a6b52219100520f/contracts/Secp256r1.sol[maxrobot] and
 * https://github.com/tdrerup/elliptic-curve-solidity/blob/59a9c25957d4d190eff53b6610731d81a077a15e/contracts/curves/EllipticCurve.sol[tdrerup] implementations.
 *
 * _Available since v5.1._
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

    /// @dev (P + 1) / 4. Useful to compute sqrt
    uint256 private constant P1DIV4 = 0x3fffffffc0000000400000000000000000000000400000000000000000000000;

    /// @dev N/2 for excluding higher order `s` values
    uint256 private constant HALF_N = 0x7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8;

    /**
     * @dev Verifies a secp256r1 signature using the RIP-7212 precompile and falls back to the Solidity implementation
     * if the precompile is not available. This version should work on all chains, but requires the deployment of more
     * bytecode.
     *
     * @param h - hashed message
     * @param r - signature half R
     * @param s - signature half S
     * @param qx - public key coordinate X
     * @param qy - public key coordinate Y
     *
     * IMPORTANT: This function disallows signatures where the `s` value is above `N/2` to prevent malleability.
     * To flip the `s` value, compute `s = N - s`.
     */
    function verify(bytes32 h, bytes32 r, bytes32 s, bytes32 qx, bytes32 qy) internal view returns (bool) {
        (bool valid, bool supported) = _tryVerifyNative(h, r, s, qx, qy);
        return supported ? valid : verifySolidity(h, r, s, qx, qy);
    }

    /**
     * @dev Same as {verify}, but it will revert if the required precompile is not available.
     *
     * Make sure any logic (code or precompile) deployed at that address is the expected one,
     * otherwise the returned value may be misinterpreted as a positive boolean.
     */
    function verifyNative(bytes32 h, bytes32 r, bytes32 s, bytes32 qx, bytes32 qy) internal view returns (bool) {
        (bool valid, bool supported) = _tryVerifyNative(h, r, s, qx, qy);
        if (supported) {
            return valid;
        } else {
            revert Errors.MissingPrecompile(address(0x100));
        }
    }

    /**
     * @dev Same as {verify}, but it will return false if the required precompile is not available.
     */
    function _tryVerifyNative(
        bytes32 h,
        bytes32 r,
        bytes32 s,
        bytes32 qx,
        bytes32 qy
    ) private view returns (bool valid, bool supported) {
        if (!_isProperSignature(r, s) || !isValidPublicKey(qx, qy)) {
            return (false, true); // signature is invalid, and its not because the precompile is missing
        } else if (_rip7212(h, r, s, qx, qy)) {
            return (true, true); // precompile is present, signature is valid
        } else if (
            // Given precompiles have no bytecode (i.e. `address(0x100).code.length == 0`), we use
            // a valid signature with small `r` and `s` values to check if the precompile is present. Taken from
            // https://github.com/C2SP/wycheproof/blob/4672ff74d68766e7785c2cac4c597effccef2c5c/testvectors/ecdsa_secp256r1_sha256_p1363_test.json#L1173-L1204
            _rip7212(
                0xbb5a52f42f9c9261ed4361f59422a1e30036e7c32b270c8807a419feca605023, // sha256("123400")
                0x0000000000000000000000000000000000000000000000000000000000000005,
                0x0000000000000000000000000000000000000000000000000000000000000001,
                0xa71af64de5126a4a4e02b7922d66ce9415ce88a4c9d25514d91082c8725ac957,
                0x5d47723c8fbe580bb369fec9c2665d8e30a435b9932645482e7c9f11e872296b
            )
        ) {
            return (false, true); // precompile is present, signature is invalid
        } else {
            return (false, false); // precompile is absent
        }
    }

    /**
     * @dev Low level helper for {_tryVerifyNative}. Calls the precompile and checks if there is a return value.
     */
    function _rip7212(bytes32 h, bytes32 r, bytes32 s, bytes32 qx, bytes32 qy) private view returns (bool isValid) {
        assembly ("memory-safe") {
            // Use the free memory pointer without updating it at the end of the function
            let ptr := mload(0x40)
            mstore(ptr, h)
            mstore(add(ptr, 0x20), r)
            mstore(add(ptr, 0x40), s)
            mstore(add(ptr, 0x60), qx)
            mstore(add(ptr, 0x80), qy)
            // RIP-7212 precompiles return empty bytes when an invalid signature is passed, making it impossible
            // to distinguish the presence of the precompile. Custom precompile implementations may decide to
            // return `bytes32(0)` (i.e. false) without developers noticing, so we decide to evaluate the return value
            // without expanding memory using scratch space.
            mstore(0x00, 0) // zero out scratch space in case the precompile doesn't return anything
            if iszero(staticcall(gas(), 0x100, ptr, 0xa0, 0x00, 0x20)) {
                invalid()
            }
            isValid := mload(0x00)
        }
    }

    /**
     * @dev Same as {verify}, but only the Solidity implementation is used.
     */
    function verifySolidity(bytes32 h, bytes32 r, bytes32 s, bytes32 qx, bytes32 qy) internal view returns (bool) {
        if (!_isProperSignature(r, s) || !isValidPublicKey(qx, qy)) {
            return false;
        }

        JPoint[16] memory points = _preComputeJacobianPoints(uint256(qx), uint256(qy));
        uint256 w = Math.invModPrime(uint256(s), N);
        uint256 u1 = mulmod(uint256(h), w, N);
        uint256 u2 = mulmod(uint256(r), w, N);
        (uint256 x, ) = _jMultShamir(points, u1, u2);
        return ((x % N) == uint256(r));
    }

    /**
     * @dev Public key recovery
     *
     * @param h - hashed message
     * @param v - signature recovery param
     * @param r - signature half R
     * @param s - signature half S
     *
     * IMPORTANT: This function disallows signatures where the `s` value is above `N/2` to prevent malleability.
     * To flip the `s` value, compute `s = N - s` and `v = 1 - v` if (`v = 0 | 1`).
     */
    function recovery(bytes32 h, uint8 v, bytes32 r, bytes32 s) internal view returns (bytes32 x, bytes32 y) {
        if (!_isProperSignature(r, s) || v > 1) {
            return (0, 0);
        }

        uint256 p = P; // cache P on the stack
        uint256 rx = uint256(r);
        uint256 ry2 = addmod(mulmod(addmod(mulmod(rx, rx, p), A, p), rx, p), B, p); // weierstrass equation y² = x³ + a.x + b
        uint256 ry = Math.modExp(ry2, P1DIV4, p); // This formula for sqrt work because P ≡ 3 (mod 4)
        if (mulmod(ry, ry, p) != ry2) return (0, 0); // Sanity check
        if (ry % 2 != v) ry = p - ry;

        JPoint[16] memory points = _preComputeJacobianPoints(rx, ry);
        uint256 w = Math.invModPrime(uint256(r), N);
        uint256 u1 = mulmod(N - (uint256(h) % N), w, N);
        uint256 u2 = mulmod(uint256(s), w, N);
        (uint256 xU, uint256 yU) = _jMultShamir(points, u1, u2);
        return (bytes32(xU), bytes32(yU));
    }

    /**
     * @dev Checks if (x, y) are valid coordinates of a point on the curve.
     * In particular this function checks that x < P and y < P.
     */
    function isValidPublicKey(bytes32 x, bytes32 y) internal pure returns (bool result) {
        assembly ("memory-safe") {
            let p := P
            let lhs := mulmod(y, y, p) // y^2
            let rhs := addmod(mulmod(addmod(mulmod(x, x, p), A, p), x, p), B, p) // ((x^2 + a) * x) + b = x^3 + ax + b
            result := and(and(lt(x, p), lt(y, p)), eq(lhs, rhs)) // Should conform with the Weierstrass equation
        }
    }

    /**
     * @dev Checks if (r, s) is a proper signature.
     * In particular, this checks that `s` is in the "lower-range", making the signature non-malleable.
     */
    function _isProperSignature(bytes32 r, bytes32 s) private pure returns (bool) {
        return uint256(r) > 0 && uint256(r) < N && uint256(s) > 0 && uint256(s) <= HALF_N;
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
        uint256 p = P; // cache P on the stack
        uint256 zinv = Math.invModPrime(jz, p);
        assembly ("memory-safe") {
            let zzinv := mulmod(zinv, zinv, p)
            ax := mulmod(jx, zzinv, p)
            ay := mulmod(jy, mulmod(zzinv, zinv, p), p)
        }
    }

    /**
     * @dev Point addition on the jacobian coordinates
     * Reference: https://www.hyperelliptic.org/EFD/g1p/auto-shortw-jacobian.html#addition-add-1998-cmo-2
     *
     * Note that:
     *
     * - `addition-add-1998-cmo-2` doesn't support identical input points. This version is modified to use
     * the `h` and `r` values computed by `addition-add-1998-cmo-2` to detect identical inputs, and fallback to
     * `doubling-dbl-1998-cmo-2` if needed.
     * - if one of the points is at infinity (i.e. `z=0`), the result is undefined.
     */
    function _jAdd(
        JPoint memory p1,
        uint256 x2,
        uint256 y2,
        uint256 z2
    ) private pure returns (uint256 rx, uint256 ry, uint256 rz) {
        assembly ("memory-safe") {
            let p := P
            let z1 := mload(add(p1, 0x40))
            let zz1 := mulmod(z1, z1, p) // zz1 = z1²
            let s1 := mulmod(mload(add(p1, 0x20)), mulmod(mulmod(z2, z2, p), z2, p), p) // s1 = y1*z2³
            let r := addmod(mulmod(y2, mulmod(zz1, z1, p), p), sub(p, s1), p) // r = s2-s1 = y2*z1³-s1 = y2*z1³-y1*z2³
            let u1 := mulmod(mload(p1), mulmod(z2, z2, p), p) // u1 = x1*z2²
            let h := addmod(mulmod(x2, zz1, p), sub(p, u1), p) // h = u2-u1 = x2*z1²-u1 = x2*z1²-x1*z2²

            // detect edge cases where inputs are identical
            switch and(iszero(r), iszero(h))
            // case 0: points are different
            case 0 {
                let hh := mulmod(h, h, p) // h²

                // x' = r²-h³-2*u1*h²
                rx := addmod(
                    addmod(mulmod(r, r, p), sub(p, mulmod(h, hh, p)), p),
                    sub(p, mulmod(2, mulmod(u1, hh, p), p)),
                    p
                )
                // y' = r*(u1*h²-x')-s1*h³
                ry := addmod(
                    mulmod(r, addmod(mulmod(u1, hh, p), sub(p, rx), p), p),
                    sub(p, mulmod(s1, mulmod(h, hh, p), p)),
                    p
                )
                // z' = h*z1*z2
                rz := mulmod(h, mulmod(z1, z2, p), p)
            }
            // case 1: points are equal
            case 1 {
                let x := x2
                let y := y2
                let z := z2
                let yy := mulmod(y, y, p)
                let zz := mulmod(z, z, p)
                let m := addmod(mulmod(3, mulmod(x, x, p), p), mulmod(A, mulmod(zz, zz, p), p), p) // m = 3*x²+a*z⁴
                let s := mulmod(4, mulmod(x, yy, p), p) // s = 4*x*y²

                // x' = t = m²-2*s
                rx := addmod(mulmod(m, m, p), sub(p, mulmod(2, s, p)), p)

                // y' = m*(s-t)-8*y⁴ = m*(s-x')-8*y⁴
                // cut the computation to avoid stack too deep
                let rytmp1 := sub(p, mulmod(8, mulmod(yy, yy, p), p)) // -8*y⁴
                let rytmp2 := addmod(s, sub(p, rx), p) // s-x'
                ry := addmod(mulmod(m, rytmp2, p), rytmp1, p) // m*(s-x')-8*y⁴

                // z' = 2*y*z
                rz := mulmod(2, mulmod(y, z, p), p)
            }
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
            let m := addmod(mulmod(3, mulmod(x, x, p), p), mulmod(A, mulmod(zz, zz, p), p), p) // m = 3*x²+a*z⁴
            let s := mulmod(4, mulmod(x, yy, p), p) // s = 4*x*y²

            // x' = t = m²-2*s
            rx := addmod(mulmod(m, m, p), sub(p, mulmod(2, s, p)), p)
            // y' = m*(s-t)-8*y⁴ = m*(s-x')-8*y⁴
            ry := addmod(mulmod(m, addmod(s, sub(p, rx), p), p), sub(p, mulmod(8, mulmod(yy, yy, p), p)), p)
            // z' = 2*y*z
            rz := mulmod(2, mulmod(y, z, p), p)
        }
    }

    /**
     * @dev Compute G·u1 + P·u2 using the precomputed points for G and P (see {_preComputeJacobianPoints}).
     *
     * Uses Strauss Shamir trick for EC multiplication
     * https://stackoverflow.com/questions/50993471/ec-scalar-multiplication-with-strauss-shamir-method
     *
     * We optimize this for 2 bits at a time rather than a single bit. The individual points for a single pass are
     * precomputed. Overall this reduces the number of additions while keeping the same number of
     * doublings
     */
    function _jMultShamir(
        JPoint[16] memory points,
        uint256 u1,
        uint256 u2
    ) private view returns (uint256 rx, uint256 ry) {
        uint256 x = 0;
        uint256 y = 0;
        uint256 z = 0;
        unchecked {
            for (uint256 i = 0; i < 128; ++i) {
                if (z > 0) {
                    (x, y, z) = _jDouble(x, y, z);
                    (x, y, z) = _jDouble(x, y, z);
                }
                // Read 2 bits of u1, and 2 bits of u2. Combining the two gives the lookup index in the table.
                uint256 pos = ((u1 >> 252) & 0xc) | ((u2 >> 254) & 0x3);
                // Points that have z = 0 are points at infinity. They are the additive 0 of the group
                // - if the lookup point is a 0, we can skip it
                // - otherwise:
                //   - if the current point (x, y, z) is 0, we use the lookup point as our new value (0+P=P)
                //   - if the current point (x, y, z) is not 0, both points are valid and we can use `_jAdd`
                if (points[pos].z != 0) {
                    if (z == 0) {
                        (x, y, z) = (points[pos].x, points[pos].y, points[pos].z);
                    } else {
                        (x, y, z) = _jAdd(points[pos], x, y, z);
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
     *
     * Note that `_jAdd` (and thus `_jAddPoint`) does not handle the case where one of the inputs is a point at
     * infinity (z = 0). However, we know that since `N ≡ 1 mod 2` and `N ≡ 1 mod 3`, there is no point P such that
     * 2P = 0 or 3P = 0. This guarantees that g, 2g, 3g, p, 2p, 3p are all non-zero, and that all `_jAddPoint` calls
     * have valid inputs.
     */
    function _preComputeJacobianPoints(uint256 px, uint256 py) private pure returns (JPoint[16] memory points) {
        points[0x00] = JPoint(0, 0, 0); // 0,0
        points[0x01] = JPoint(px, py, 1); // 1,0 (p)
        points[0x04] = JPoint(GX, GY, 1); // 0,1 (g)
        points[0x02] = _jDoublePoint(points[0x01]); // 2,0 (2p)
        points[0x08] = _jDoublePoint(points[0x04]); // 0,2 (2g)
        points[0x03] = _jAddPoint(points[0x01], points[0x02]); // 3,0 (p+2p = 3p)
        points[0x05] = _jAddPoint(points[0x01], points[0x04]); // 1,1 (p+g)
        points[0x06] = _jAddPoint(points[0x02], points[0x04]); // 2,1 (2p+g)
        points[0x07] = _jAddPoint(points[0x03], points[0x04]); // 3,1 (3p+g)
        points[0x09] = _jAddPoint(points[0x01], points[0x08]); // 1,2 (p+2g)
        points[0x0a] = _jAddPoint(points[0x02], points[0x08]); // 2,2 (2p+2g)
        points[0x0b] = _jAddPoint(points[0x03], points[0x08]); // 3,2 (3p+2g)
        points[0x0c] = _jAddPoint(points[0x04], points[0x08]); // 0,3 (g+2g = 3g)
        points[0x0d] = _jAddPoint(points[0x01], points[0x0c]); // 1,3 (p+3g)
        points[0x0e] = _jAddPoint(points[0x02], points[0x0c]); // 2,3 (2p+3g)
        points[0x0f] = _jAddPoint(points[0x03], points[0x0c]); // 3,3 (3p+3g)
    }

    function _jAddPoint(JPoint memory p1, JPoint memory p2) private pure returns (JPoint memory) {
        (uint256 x, uint256 y, uint256 z) = _jAdd(p1, p2.x, p2.y, p2.z);
        return JPoint(x, y, z);
    }

    function _jDoublePoint(JPoint memory p) private pure returns (JPoint memory) {
        (uint256 x, uint256 y, uint256 z) = _jDouble(p.x, p.y, p.z);
        return JPoint(x, y, z);
    }
}
