// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {P256} from "@openzeppelin/contracts/utils/cryptography/P256.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {WebAuthn} from "@openzeppelin/contracts/utils/cryptography/WebAuthn.sol";

contract WebAuthnTest is Test {
    /// forge-config: default.fuzz.runs = 512
    function testVerify(bytes memory challenge, uint256 seed) public view {
        assertTrue(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UP),
                _encodeClientDataJSON(challenge),
                false
            )
        );
    }

    /// forge-config: default.fuzz.runs = 512
    function testVerifyInvalidType(bytes memory challenge, uint256 seed) public view {
        assertFalse(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UP | WebAuthn.AUTH_DATA_FLAGS_UV),
                // solhint-disable-next-line quotes
                string.concat('{"type":"webauthn.create","challenge":"', Base64.encodeURL(challenge), '"}'),
                false
            )
        );
    }

    /// forge-config: default.fuzz.runs = 512
    function testVerifyInvalidChallenge(bytes memory challenge, uint256 seed) public view {
        vm.assume(keccak256(challenge) != keccak256(bytes("invalid_challenge")));
        assertFalse(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UP | WebAuthn.AUTH_DATA_FLAGS_UV),
                _encodeClientDataJSON(bytes("invalid_challenge")),
                false
            )
        );
    }

    /// forge-config: default.fuzz.runs = 512
    function testVerifyFlagsUP(bytes memory challenge, uint256 seed) public view {
        // UP = false: FAIL
        assertFalse(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UV),
                _encodeClientDataJSON(challenge),
                false
            )
        );
    }

    /// forge-config: default.fuzz.runs = 512
    function testVerifyFlagsUV(bytes memory challenge, uint256 seed) public view {
        // UV = false, requireUV = false: SUCCESS
        assertTrue(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UP),
                _encodeClientDataJSON(challenge),
                false
            )
        );
        // UV = false, requireUV = true: FAIL
        assertFalse(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UP),
                _encodeClientDataJSON(challenge),
                true
            )
        );
        // UV = true, requireUV = true: SUCCESS
        assertTrue(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(WebAuthn.AUTH_DATA_FLAGS_UP | WebAuthn.AUTH_DATA_FLAGS_UV),
                _encodeClientDataJSON(challenge),
                true
            )
        );
    }

    /// forge-config: default.fuzz.runs = 512
    function testVerifyFlagsBEBS(bytes memory challenge, uint256 seed) public view {
        // BS = true, BE = false: FAIL
        assertFalse(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(
                    WebAuthn.AUTH_DATA_FLAGS_UP | WebAuthn.AUTH_DATA_FLAGS_UV | WebAuthn.AUTH_DATA_FLAGS_BS
                ),
                _encodeClientDataJSON(challenge),
                false
            )
        );
        // BS = false, BE = true: SUCCESS
        assertTrue(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(
                    WebAuthn.AUTH_DATA_FLAGS_UP | WebAuthn.AUTH_DATA_FLAGS_UV | WebAuthn.AUTH_DATA_FLAGS_BE
                ),
                _encodeClientDataJSON(challenge),
                false
            )
        );
        // BS = true, BE = true: SUCCESS
        assertTrue(
            _runVerify(
                seed,
                challenge,
                _encodeAuthenticatorData(
                    WebAuthn.AUTH_DATA_FLAGS_UP |
                        WebAuthn.AUTH_DATA_FLAGS_UV |
                        WebAuthn.AUTH_DATA_FLAGS_BE |
                        WebAuthn.AUTH_DATA_FLAGS_BS
                ),
                _encodeClientDataJSON(challenge),
                false
            )
        );
    }

    function _runVerify(
        uint256 seed,
        bytes memory challenge,
        bytes memory authenticatorData,
        string memory clientDataJSON,
        bool requireUV
    ) private view returns (bool) {
        // Generate private key and get public key
        uint256 privateKey = bound(seed, 1, P256.N - 1);
        (uint256 x, uint256 y) = vm.publicKeyP256(privateKey);

        // Sign the message
        bytes32 messageHash = sha256(abi.encodePacked(authenticatorData, sha256(bytes(clientDataJSON))));
        (bytes32 r, bytes32 s) = vm.signP256(privateKey, messageHash);

        // Verify the signature
        return
            WebAuthn.verify(
                challenge,
                WebAuthn.WebAuthnAuth({
                    authenticatorData: authenticatorData,
                    clientDataJSON: clientDataJSON,
                    challengeIndex: 23, // Position of challenge in clientDataJSON
                    typeIndex: 1, // Position of type in clientDataJSON
                    r: r,
                    s: bytes32(Math.min(uint256(s), P256.N - uint256(s)))
                }),
                bytes32(x),
                bytes32(y),
                requireUV
            );
    }

    function testTryDecodeAuthValid(
        bytes32 r,
        bytes32 s,
        uint256 challengeIndex,
        uint256 typeIndex,
        bytes memory authenticatorData,
        string memory clientDataJSON
    ) public view {
        (bool success, WebAuthn.WebAuthnAuth memory auth) = this.tryDecodeAuth(
            abi.encode(r, s, challengeIndex, typeIndex, authenticatorData, clientDataJSON)
        );
        assertTrue(success);
        assertEq(auth.r, r);
        assertEq(auth.s, s);
        assertEq(auth.challengeIndex, challengeIndex);
        assertEq(auth.typeIndex, typeIndex);
        assertEq(auth.authenticatorData, authenticatorData);
        assertEq(auth.clientDataJSON, clientDataJSON);
    }

    function testTryDecodeAuthInvalid() public view {
        bytes32 r = keccak256("r");
        bytes32 s = keccak256("s");
        uint256 challengeIndex = 17;
        uint256 typeIndex = 1;

        // too short
        assertFalse(this.tryDecodeAuthDrop(abi.encodePacked(r, s, challengeIndex, typeIndex)));

        // offset out of bound
        assertFalse(
            this.tryDecodeAuthDrop(abi.encodePacked(r, s, challengeIndex, typeIndex, uint256(0xc0), uint256(0)))
        );
        assertFalse(
            this.tryDecodeAuthDrop(abi.encodePacked(r, s, challengeIndex, typeIndex, uint256(0), uint256(0xc0)))
        );

        // minimal valid (bytes and string both length 0, at the same position)
        assertTrue(
            this.tryDecodeAuthDrop(
                abi.encodePacked(r, s, challengeIndex, typeIndex, uint256(0xc0), uint256(0xc0), uint256(0))
            )
        );

        // length out of bound
        assertTrue(
            this.tryDecodeAuthDrop(
                abi.encodePacked(
                    r,
                    s,
                    challengeIndex,
                    typeIndex,
                    uint256(0xc0),
                    uint256(0xe0),
                    uint256(0x20),
                    uint256(0)
                )
            )
        );
        assertFalse(
            this.tryDecodeAuthDrop(
                abi.encodePacked(
                    r,
                    s,
                    challengeIndex,
                    typeIndex,
                    uint256(0xc0),
                    uint256(0xe0),
                    uint256(0x21),
                    uint256(0)
                )
            )
        );
        assertTrue(
            this.tryDecodeAuthDrop(
                abi.encodePacked(
                    r,
                    s,
                    challengeIndex,
                    typeIndex,
                    uint256(0xc0),
                    uint256(0xe0),
                    uint256(0),
                    uint256(0x00)
                )
            )
        );
        assertFalse(
            this.tryDecodeAuthDrop(
                abi.encodePacked(
                    r,
                    s,
                    challengeIndex,
                    typeIndex,
                    uint256(0xc0),
                    uint256(0xe0),
                    uint256(0),
                    uint256(0x01)
                )
            )
        );
    }

    function tryDecodeAuth(
        bytes calldata encoded
    ) public pure returns (bool success, WebAuthn.WebAuthnAuth calldata auth) {
        (success, auth) = WebAuthn.tryDecodeAuth(encoded);
    }

    function tryDecodeAuthDrop(bytes calldata encoded) public pure returns (bool success) {
        (success, ) = WebAuthn.tryDecodeAuth(encoded);
    }

    function _encodeAuthenticatorData(bytes1 flags) private pure returns (bytes memory) {
        return abi.encodePacked(bytes32(0), flags, bytes4(0));
    }

    function _encodeClientDataJSON(bytes memory challenge) private pure returns (string memory) {
        // solhint-disable-next-line quotes
        return string.concat('{"type":"webauthn.get","challenge":"', Base64.encodeURL(challenge), '"}');
    }
}
