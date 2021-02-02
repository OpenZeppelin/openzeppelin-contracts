// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../math/SafeMath.sol";

contract SafeMathMock {
    function tryAdd(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.tryAdd(a, b);
    }

    function trySub(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.trySub(a, b);
    }

    function tryMul(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.tryMul(a, b);
    }

    function tryDiv(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.tryDiv(a, b);
    }

    function tryMod(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.tryMod(a, b);
    }

    // using the do* naming convention to avoid warnings due to clashing opcode names

    function doAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.add(a, b);
    }

    function doSub(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.sub(a, b);
    }

    function doMul(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.mul(a, b);
    }

    function doDiv(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.div(a, b);
    }

    function doMod(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.mod(a, b);
    }

    function subWithMessage(uint256 a, uint256 b, string memory errorMessage) public pure returns (uint256) {
        return SafeMath.sub(a, b, errorMessage);
    }

    function divWithMessage(uint256 a, uint256 b, string memory errorMessage) public pure returns (uint256) {
        return SafeMath.div(a, b, errorMessage);
    }

    function modWithMessage(uint256 a, uint256 b, string memory errorMessage) public pure returns (uint256) {
        return SafeMath.mod(a, b, errorMessage);
    }

    function addMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := mload(0x40) }
        for (uint256 i = 0; i < length; ++i) { SafeMath.add(1, 1); }
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := sub(mload(0x40), mem) }
    }

    function subMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := mload(0x40) }
        for (uint256 i = 0; i < length; ++i) { SafeMath.sub(1, 1); }
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := sub(mload(0x40), mem) }
    }

    function mulMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := mload(0x40) }
        for (uint256 i = 0; i < length; ++i) { SafeMath.mul(1, 1); }
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := sub(mload(0x40), mem) }
    }

    function divMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := mload(0x40) }
        for (uint256 i = 0; i < length; ++i) { SafeMath.div(1, 1); }
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := sub(mload(0x40), mem) }
    }

    function modMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := mload(0x40) }
        for (uint256 i = 0; i < length; ++i) { SafeMath.mod(1, 1); }
        // solhint-disable-next-line no-inline-assembly
        assembly { mem := sub(mload(0x40), mem) }
    }

}
