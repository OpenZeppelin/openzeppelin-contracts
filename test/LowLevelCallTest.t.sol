// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {LowLevelCall} from "contracts/utils/LowLevelCall.sol";

contract LowLevelCallTest is Test {
    using LowLevelCall for address;

    function testUnalignedMemory() public {
        address target = address(new MockContract());

        bool success = LowLevelCall.callNoReturn(target, abi.encodeWithSignature("foo()"));
        assertTrue(success);

        bytes memory data = LowLevelCall.returnData();

        uint256 freeMemPtr;
        assembly {
            freeMemPtr := mload(0x40)
        }

        console.log("Free memory pointer after returnData():", freeMemPtr);

        // Allocate a new array and see if it's aligned
        uint256[] memory newArr = new uint256[](1);
        newArr[0] = 0x12345678;

        uint256 newArrPtr;
        assembly {
            newArrPtr := newArr
        }
        console.log("New array pointer:", newArrPtr);

        // Is the free memory pointer a multiple of 32?
        assertTrue(freeMemPtr % 32 == 0, "Free memory pointer is not aligned");
    }
}

contract MockContract {
    function foo() public pure returns (bytes10) {
        return 0x0102030405060708090a;
    }
}
