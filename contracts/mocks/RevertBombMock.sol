// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract RevertBombMock {
    fallback() external payable {
        bytes memory bomb = new bytes(200 * 1024); // expand memory
        assembly ("memory-safe") {
            for {} gt(gas(), 3000) {} {} // burn gas so the simulator is left starved
            revert(add(bomb, 0x20), mload(bomb)) // revert with the already-allocated buffer (cheap)
        }
    }
}
