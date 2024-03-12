// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";

/**
 *  TODO:
 *  - Further optimize ?
 *  - Re-write documentation
 *  - Update (refactor/add) tests
 *
 *  Inspired by Adrià Massanet's work: https://github.com/adria0/SolRsaVerify
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Checked results with FIPS test vectors
 *  https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/dss/186-2rsatestvectors.zip
 *  file SigVer15_186-3.rsp
 */
library RSA {
    /**
     * @dev Verifies a PKCSv1.5 SHA256 signature
     * @param data to verify
     * @param sig is the signature
     * @param exp is the exponent
     * @param mod is the modulus
     */
    function pkcs1Sha256(
        bytes memory data,
        bytes memory sig,
        bytes memory exp,
        bytes memory mod
    ) public view returns (bool) {
        return pkcs1Sha256(sha256(data), sig, exp, mod);
    }

    /**
     * @dev Verifies a PKCSv1.5 SHA256 signature
     * @param digest is the sha256 of the data
     * @param sig is the signature
     * @param exp is the exponent
     * @param mod is the modulus
     */
    function pkcs1Sha256(
        bytes32 digest,
        bytes memory sig,
        bytes memory exp,
        bytes memory mod
    ) public view returns (bool) {
        unchecked {
            // cache and check length
            uint256 length = mod.length;
            if (length < 0x40 || length != sig.length) {
                return false;
            }

            (bool success, bytes memory buffer) = Math.tryModExp(sig, exp, mod);
            if (!success) {
                return false;
            }

            // Check that buffer is well encoded:
            // buffer ::= 0x00 | 0x01 | PS | 0x00 | DigestInfo
            //
            // With
            // - PS is padding filled with 0xFF
            // - DigestInfo ::= SEQUENCE {
            //    digestAlgorithm AlgorithmIdentifier,
            //      [optional algorithm parameters]
            //    digest OCTET STRING
            // }

            // Get AlgorithmIdentifier from the DigestInfo, and set the parameters accordingly
            bytes32 digestAlgoParam;
            bytes32 digestAlgoParamMask;
            uint256 digestAlgoOffset;
            if (_unsafeReadBytes1(buffer, length - 50) == 0x31) {
                // case: sha256Explicit
                digestAlgoOffset = 0x36;
                digestAlgoParam = 0x003031300d060960864801650304020105000000000000000000000000000000;
                digestAlgoParamMask = 0xffffffffffffffffffffffffffffffffffff0000000000000000000000000000;
            } else if (_unsafeReadBytes1(buffer, length - 48) == 0x2F) {
                // case: sha256Implicit
                digestAlgoOffset = 0x34;
                digestAlgoParam = 0x00302f300b060960864801650304020100000000000000000000000000000000;
                digestAlgoParamMask = 0xffffffffffffffffffffffffffffffff00000000000000000000000000000000;
            } else {
                // unknown
                return false;
            }

            // length is at least 0x40 and digestAlgoOffset is at most 0x34, so this is safe
            uint256 paddingLength = length - digestAlgoOffset;

            // the padding has variable (arbitrary) length, so we check it byte per byte in a loop.
            for (uint256 i = 2; i < paddingLength + 2; ++i) {
                if (_unsafeReadBytes1(buffer, i) != 0xFF) {
                    return false;
                }
            }
            // All the other parameters are small enough to fit in a bytes32, so we can check them directly.
            return
                bytes2(0x0001) == _unsafeReadBytes2(buffer, 0x00) &&
                digestAlgoParam == _unsafeReadBytes32(buffer, paddingLength + 0x02) & digestAlgoParamMask &&
                bytes2(0x0420) == _unsafeReadBytes2(buffer, length - 0x22) &&
                digest == _unsafeReadBytes32(buffer, length - 0x20);
        }
    }

    function _unsafeReadBytes32(bytes memory array, uint256 offset) private pure returns (bytes32 result) {
        assembly {
            result := mload(add(add(array, 0x20), offset))
        }
    }

    function _unsafeReadBytes1(bytes memory array, uint256 offset) private pure returns (bytes1) {
        return bytes1(_unsafeReadBytes32(array, offset));
    }

    function _unsafeReadBytes2(bytes memory array, uint256 offset) private pure returns (bytes2) {
        return bytes2(_unsafeReadBytes32(array, offset));
    }
}
