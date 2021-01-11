// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../math/SafeMath.sol";

contract SafeMathMock {
    function addWithFlag(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.addX(a, b);
    }

    function subWithFlag(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.subX(a, b);
    }

    function mulWithFlag(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.mulX(a, b);
    }

    function divWithFlag(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.divX(a, b);
    }

    function modWithFlag(uint256 a, uint256 b) public pure returns (bool flag, uint256 value) {
        return SafeMath.modX(a, b);
    }

    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.add(a, b);
    }

    function sub(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.sub(a, b);
    }

    function mul(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.mul(a, b);
    }

    function div(uint256 a, uint256 b) public pure returns (uint256) {
        return SafeMath.div(a, b);
    }

    function mod(uint256 a, uint256 b) public pure returns (uint256) {
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
