// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Address} from "../utils/Address.sol";

contract BatchCaller {
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    function execute(Call[] calldata calls) external returns (bytes[] memory) {
        bytes[] memory returndata = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; ++i) {
            returndata[i] = Address.functionCallWithValue(calls[i].target, calls[i].data, calls[i].value);
        }
        return returndata;
    }
}
