// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/SafeMath.sol";

library SafeMathMemoryCheck {
    function addMemoryCheck() internal pure returns (uint256 mem) {
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

    function subMemoryCheck() internal pure returns (uint256 mem) {
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

    function mulMemoryCheck() internal pure returns (uint256 mem) {
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

    function divMemoryCheck() internal pure returns (uint256 mem) {
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

    function modMemoryCheck() internal pure returns (uint256 mem) {
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
