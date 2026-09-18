// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract Base64Test is Test {
    function testEncode(bytes memory input) external pure {
        assertEq(Base64.encode(input), vm.toBase64(input));
        assertEq(Base64.decode(Base64.encode(input)), input);
    }

    function testEncodeURL(bytes memory input) external pure {
        assertEq(Base64.encodeURL(input), _removePadding(vm.toBase64URL(input)));
        assertEq(Base64.decode(Base64.encodeURL(input)), input);
    }

    function testTryDecode(bytes memory input) external pure {
        (bool success, bytes memory output) = Base64.tryDecode(Base64.encode(input));
        assertTrue(success);
        assertEq(output, input);
    }

    function testTryDecodeInvalid() external pure {
        // '@' is not part of the Base64 alphabet.
        (bool success, bytes memory output) = Base64.tryDecode("TW@u");
        assertFalse(success);
        assertEq(output, hex"");
    }

    function testTryDecodeInvalidRestoresFreeMemoryPointer(bytes memory input) external pure {
        bytes memory buf = bytes.concat(hex"0000", input); // Prepend two 0x00 (outside Base64 alphabet)
        uint256 fmpBefore;
        assembly {
            fmpBefore := mload(0x40)
        }
        (bool success, bytes memory output) = Base64.tryDecode(string(buf));
        uint256 fmpAfter;
        assembly {
            fmpAfter := mload(0x40)
        }
        assertFalse(success);
        assertEq(output, hex"");
        assertEq(fmpAfter, fmpBefore);
    }

    // `_tryDecode` temporarily overwrites the 32 bytes that follow `data` with fake "==" padding. Before
    // `tryDecode`, an invalid character reverted, so restoring that word was unobservable on that path.
    // `data` is exactly 32 bytes so the clobbered word is exactly `guard`'s length slot.
    function testTryDecodeInvalidRestoresMemoryAfterInput() external pure {
        bytes memory data = bytes("TWFuTWFuTWFuTWFuTWFuTWFuTWFuTW@u"); // '@' is outside the alphabet
        bytes memory guard = new bytes(32);

        (bool success, bytes memory output) = Base64.tryDecode(string(data));

        assertFalse(success);
        assertEq(output, hex"");
        assertEq(guard.length, 32);
    }

    function _removePadding(string memory inputStr) internal pure returns (string memory) {
        bytes memory input = bytes(inputStr);
        bytes memory output;

        for (uint256 i = 0; i < input.length; ++i) {
            if (input[input.length - i - 1] != 0x3d) {
                output = new bytes(input.length - i);
                break;
            }
        }

        for (uint256 i = 0; i < output.length; ++i) {
            output[i] = input[i];
        }

        return string(output);
    }
}
