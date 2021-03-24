// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Address.sol";

/*
 * @dev Provides a way to batch together multiple function calls in a single external call.
 */
abstract contract BatchCall {
   function batchCall(bytes[] calldata data) external returns(bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint i = 0; i < data.length; i++) {
            results[i] = Address.functionDelegateCall(address(this), data[i]);
        }
        return results;
    }
}
