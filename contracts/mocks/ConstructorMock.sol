// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract ConstructorMock {
    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    error CustomError();

    constructor(RevertType error) {
        if (error == RevertType.RevertWithoutMessage) {
            revert();
        } else if (error == RevertType.RevertWithMessage) {
            revert("ConstructorMock: reverting");
        } else if (error == RevertType.RevertWithCustomError) {
            revert CustomError();
        } else if (error == RevertType.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }
    }
}
