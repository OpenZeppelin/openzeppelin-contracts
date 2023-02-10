// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/StaticDelegateCall.sol";

contract StaticDelegateCallImplementationMock {
    uint256 private _x;

    function process(uint256 c) external view returns (uint256) {
        require(c < 5);
        return _x + c;
    }
}

contract StaticDelegateCallMock is StaticDelegateCall {
    uint256 private _x;

    address private _implementation;

    constructor(uint256 x, address implementation) {
        _x = x;
        _implementation = implementation;
    }

    function process(uint256 c) external view returns (uint256) {
        (bool success, bytes memory result) = _staticDelegateCall(
            _implementation,
            abi.encodeCall(StaticDelegateCallImplementationMock.process, (c))
        );
        if (!success) revert("Implementation reverted");
        return abi.decode(result, (uint256));
    }
}
