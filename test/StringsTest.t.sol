// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {Strings} from "contracts/utils/Strings.sol";

contract StringsTest is Test {
    using Strings for string;

    function testEscapeJSONMemoryCorruption() public {
        string memory s = "a";
        string memory a = s.escapeJSON();

        uint256[] memory b = new uint256[](0xff);

        bytes32 aDataWord;
        assembly {
            aDataWord := mload(add(a, 0x20))
        }

        console.log("aDataWord:");
        console.logBytes32(aDataWord);

        bytes32 expected = 0x6100000000000000000000000000000000000000000000000000000000000000;
        assertEq(aDataWord, expected, "Memory corruption in escapeJSON padding!");

        bytes memory encodedA = abi.encode(a);
        console.log("Encoded a:");
        console.logBytes(encodedA);
    }
}
