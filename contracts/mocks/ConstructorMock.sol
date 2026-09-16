// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract ConstructorMock {
    bool foo;

    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    error CustomError();

    constructor(RevertType err) {
        // After transpilation to upgradeable contract, the constructor will become an initializer
        // To silence the `... can be restricted to view` warning, we write to state
        foo = true;

        if (err == RevertType.RevertWithoutMessage) {
            revert();
        } else if (err == RevertType.RevertWithMessage) {
            revert("ConstructorMock: reverting");
        } else if (err == RevertType.RevertWithCustomError) {
            revert CustomError();
        } else if (err == RevertType.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }
    }
}
