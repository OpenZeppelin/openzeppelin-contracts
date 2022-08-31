// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/SafeMath.sol";

contract SafeMathMemoryMock {
    function addMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        assembly {
            mem := mload(0x40)
        }
        for (uint256 i = 0; i < length; ++i) {
            SafeMath.add(1, 1);
        }
        assembly {
            mem := sub(mload(0x40), mem)
        }
    }

    function subMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        assembly {
            mem := mload(0x40)
        }
        for (uint256 i = 0; i < length; ++i) {
            SafeMath.sub(1, 1);
        }
        assembly {
            mem := sub(mload(0x40), mem)
        }
    }

    function mulMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        assembly {
            mem := mload(0x40)
        }
        for (uint256 i = 0; i < length; ++i) {
            SafeMath.mul(1, 1);
        }
        assembly {
            mem := sub(mload(0x40), mem)
        }
    }

    function divMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        assembly {
            mem := mload(0x40)
        }
        for (uint256 i = 0; i < length; ++i) {
            SafeMath.div(1, 1);
        }
        assembly {
            mem := sub(mload(0x40), mem)
        }
    }

    function modMemoryCheck() public pure returns (uint256 mem) {
        uint256 length = 32;
        assembly {
            mem := mload(0x40)
        }
        for (uint256 i = 0; i < length; ++i) {
            SafeMath.mod(1, 1);
        }
        assembly {
            mem := sub(mload(0x40), mem)
        }
    }
}
